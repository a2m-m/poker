import { describe, expect, it } from 'vitest';
import { advanceStreet, shouldAdvanceStreet } from './streets';
import type { GameSettings, HandState, Player } from './types';

const baseSettings: GameSettings = {
  sb: 100,
  bb: 200,
  roundingRule: 'BUTTON_NEAR',
  burnCard: true,
};

const buildPlayers = (): Player[] => [
  { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
  { id: 'p2', name: 'Bob', seatIndex: 1, stack: 1200, state: 'ACTIVE' },
  { id: 'p3', name: 'Carol', seatIndex: 2, stack: 800, state: 'ACTIVE' },
];

const buildHand = (overrides: Partial<HandState> = {}): HandState => {
  const contribThisStreet = overrides.contribThisStreet ?? { p1: 400, p2: 400, p3: 400 };
  const totalContribThisHand = overrides.totalContribThisHand ?? { ...contribThisStreet };

  return {
    handNumber: 1,
    dealerIndex: 0,
    sbIndex: 1,
    bbIndex: 2,
    street: 'PREFLOP',
    currentTurnPlayerId: 'p1',
    currentBet: 400,
    lastRaiseSize: 400,
    reopenAllowed: true,
    contribThisStreet,
    totalContribThisHand,
    pot: { main: 1200, sides: [] },
    actionLog: [
      { seq: 1, type: 'CALL', playerId: 'p1', amount: 400, street: 'PREFLOP' },
      { seq: 2, type: 'CALL', playerId: 'p2', amount: 400, street: 'PREFLOP' },
      { seq: 3, type: 'CHECK', playerId: 'p3', street: 'PREFLOP' },
    ],
    ...overrides,
  };
};

describe('shouldAdvanceStreet', () => {
  it('アクティブ全員の投入が揃い、全員が行動済みであればストリート終了とみなす', () => {
    const players = buildPlayers();
    const hand = buildHand();

    expect(shouldAdvanceStreet(players, hand)).toBe(true);
  });

  it('未行動のアクティブプレイヤーがいれば継続する', () => {
    const players = buildPlayers();
    const hand = buildHand({
      actionLog: [
        { seq: 1, type: 'CALL', playerId: 'p1', amount: 400, street: 'PREFLOP' },
        { seq: 2, type: 'CALL', playerId: 'p2', amount: 400, street: 'PREFLOP' },
      ],
    });

    expect(shouldAdvanceStreet(players, hand)).toBe(false);
  });

  it('フォールドやオールインは判定対象外として扱う', () => {
    const players = buildPlayers();
    players[1].state = 'FOLDED';
    players[2].state = 'ALL_IN';
    const hand = buildHand({
      contribThisStreet: { p1: 0, p2: 0, p3: 0 },
      currentBet: 0,
      actionLog: [{ seq: 1, type: 'CHECK', playerId: 'p1', street: 'PREFLOP' }],
    });

    expect(shouldAdvanceStreet(players, hand)).toBe(true);
  });
});

describe('advanceStreet', () => {
  it('ストリートを進めて投入額や手番をリセットする', () => {
    const players = buildPlayers();
    const hand = buildHand();

    const log = advanceStreet(players, hand, baseSettings);

    expect(log.type).toBe('ADVANCE_STREET');
    expect(hand.street).toBe('FLOP');
    expect(hand.currentBet).toBe(0);
    expect(hand.lastRaiseSize).toBe(baseSettings.bb);
    expect(hand.contribThisStreet).toEqual({ p1: 0, p2: 0, p3: 0 });
    expect(hand.totalContribThisHand).toEqual({ p1: 400, p2: 400, p3: 400 });
    expect(hand.reopenAllowed).toBe(true);
    expect(hand.currentTurnPlayerId).toBe('p2');
    expect(hand.actionLog).toHaveLength(4);
  });

  it('ストリート遷移前のスナップショットをログに保持する', () => {
    const players = buildPlayers();
    const hand = buildHand();
    const before = JSON.parse(JSON.stringify(hand));

    advanceStreet(players, hand, baseSettings);

    const snapshot = hand.actionLog.at(-1)?.snapshot;
    expect(snapshot).toEqual(before);
  });

  it('条件未達のまま呼び出すとエラーになる', () => {
    const players = buildPlayers();
    const hand = buildHand({
      contribThisStreet: { p1: 200, p2: 400, p3: 400 },
      currentBet: 400,
    });

    expect(() => advanceStreet(players, hand, baseSettings)).toThrow('ストリート終了条件を満たしていません。');
  });
});
