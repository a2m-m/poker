import { describe, expect, it } from 'vitest';
import { detectHandEnd } from './hands';
import type { HandState, Player } from './types';

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

describe('detectHandEnd', () => {
  it('残存プレイヤーが1人以下なら即座に配当へ遷移する', () => {
    const players = buildPlayers();
    players[1].state = 'FOLDED';
    players[2].state = 'FOLDED';
    const hand = buildHand();

    expect(detectHandEnd(players, hand)).toBe('PAYOUT');
  });

  it('リバーで全員の投入と行動が揃っていればショーダウンへ遷移する', () => {
    const players = buildPlayers();
    const hand = buildHand({
      street: 'RIVER',
      actionLog: [
        { seq: 1, type: 'CALL', playerId: 'p1', amount: 400, street: 'RIVER' },
        { seq: 2, type: 'CALL', playerId: 'p2', amount: 400, street: 'RIVER' },
        { seq: 3, type: 'CHECK', playerId: 'p3', street: 'RIVER' },
      ],
    });

    expect(detectHandEnd(players, hand)).toBe('SHOWDOWN');
  });

  it('リバーでも条件未達なら継続する', () => {
    const players = buildPlayers();
    const hand = buildHand({
      street: 'RIVER',
      contribThisStreet: { p1: 400, p2: 200, p3: 400 },
    });

    expect(detectHandEnd(players, hand)).toBeNull();
  });
});
