import { describe, expect, it } from 'vitest';
import { calcCallNeeded } from './bets';
import { getAvailableActions } from './actions';
import type { HandState, Player } from './types';

const buildPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alice',
  seatIndex: 0,
  stack: 1000,
  state: 'ACTIVE',
  ...overrides,
});

const buildHand = (overrides: Partial<HandState> = {}): HandState => ({
  handNumber: 1,
  dealerIndex: 0,
  sbIndex: 0,
  bbIndex: 1,
  street: 'PREFLOP',
  currentTurnPlayerId: 'p1',
  currentBet: 0,
  lastRaiseSize: 200,
  reopenAllowed: true,
  contribThisStreet: { p1: 0, p2: 0 },
  pot: { main: 0, sides: [] },
  actionLog: [],
  ...overrides,
});

describe('getAvailableActions', () => {
  it('コール必要額が0ならCHECKが可能になる', () => {
    const player = buildPlayer();
    const hand = buildHand({ currentBet: 0 });

    expect(calcCallNeeded(hand, player.id)).toBe(0);
    expect(getAvailableActions(hand, player)).toContain('CHECK');
  });

  it('コール必要額がありスタックが残っていればCALLが可能になる', () => {
    const player = buildPlayer({ stack: 500 });
    const hand = buildHand({ currentBet: 200, contribThisStreet: { p1: 0 } });

    expect(calcCallNeeded(hand, player.id)).toBe(200);
    expect(getAvailableActions(hand, player)).toContain('CALL');
  });

  it('現在ベットが0でスタックがあればBETが可能になる', () => {
    const player = buildPlayer({ stack: 300 });
    const hand = buildHand({ currentBet: 0 });

    expect(getAvailableActions(hand, player)).toContain('BET');
  });

  it('現在ベットがあり再オープンが許可されていればRAISEが可能になる', () => {
    const player = buildPlayer({ stack: 800 });
    const hand = buildHand({ currentBet: 300, reopenAllowed: true });

    expect(getAvailableActions(hand, player)).toContain('RAISE');
  });

  it('再オープン不可ではRAISEが候補に含まれない', () => {
    const player = buildPlayer({ stack: 800 });
    const hand = buildHand({ currentBet: 300, reopenAllowed: false });

    expect(getAvailableActions(hand, player)).not.toContain('RAISE');
  });

  it('ACTIVEであれば常にFOLDが候補に含まれる', () => {
    const player = buildPlayer();
    const hand = buildHand();

    expect(getAvailableActions(hand, player)).toContain('FOLD');
  });

  it('スタックが残っていればALL_INが候補に含まれる', () => {
    const player = buildPlayer({ stack: 500 });
    const hand = buildHand();

    expect(getAvailableActions(hand, player)).toContain('ALL_IN');
  });

  it('フォールド済みやオールインのプレイヤーはアクションを持たない', () => {
    const folded = buildPlayer({ state: 'FOLDED' });
    const allIn = buildPlayer({ state: 'ALL_IN', stack: 0 });
    const hand = buildHand();

    expect(getAvailableActions(hand, folded)).toEqual([]);
    expect(getAvailableActions(hand, allIn)).toEqual([]);
  });
});
