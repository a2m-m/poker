import { describe, expect, it } from 'vitest';
import { calcCallNeeded } from './bets';
import { applyAllIn, applyBasicAction, applyBetOrRaise, getAvailableActions } from './actions';
import type { HandState, Player } from './types';

const buildPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alice',
  seatIndex: 0,
  stack: 1000,
  state: 'ACTIVE',
  ...overrides,
});

const buildHand = (overrides: Partial<HandState> = {}): HandState => {
  const contribThisStreet = overrides.contribThisStreet ?? { p1: 0, p2: 0 };
  const totalContribThisHand = overrides.totalContribThisHand ?? { ...contribThisStreet };

  return {
    handNumber: 1,
    dealerIndex: 0,
    sbIndex: 0,
    bbIndex: 1,
    street: 'PREFLOP',
    currentTurnPlayerId: 'p1',
    currentBet: 0,
    lastRaiseSize: 200,
    reopenAllowed: true,
    contribThisStreet,
    totalContribThisHand,
    pot: { main: 0, sides: [] },
    actionLog: [],
    ...overrides,
  };
};

const cloneHand = (hand: HandState): HandState => JSON.parse(JSON.stringify(hand)) as HandState;

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

describe('applyBasicAction', () => {
  const buildPlayers = (): Player[] => [
    { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
    { id: 'p2', name: 'Bob', seatIndex: 1, stack: 800, state: 'ACTIVE' },
    { id: 'p3', name: 'Carol', seatIndex: 2, stack: 600, state: 'ACTIVE' },
  ];

  const buildHandState = (overrides: Partial<HandState> = {}): HandState => {
    const contribThisStreet = overrides.contribThisStreet ?? { p1: 0, p2: 0, p3: 0 };
    const totalContribThisHand = overrides.totalContribThisHand ?? { ...contribThisStreet };

    return {
      handNumber: 1,
      dealerIndex: 0,
      sbIndex: 1,
      bbIndex: 2,
      street: 'PREFLOP',
      currentTurnPlayerId: 'p1',
      currentBet: 0,
      lastRaiseSize: 200,
      reopenAllowed: true,
      contribThisStreet,
      totalContribThisHand,
      pot: { main: 0, sides: [] },
      actionLog: [],
      ...overrides,
    };
  };

  it('CHECKで状態を変えず手番を次のアクティブに進める', () => {
    const players = buildPlayers();
    const hand = buildHandState({ currentBet: 0 });

    const log = applyBasicAction(players, hand, 'CHECK');

    expect(log.type).toBe('CHECK');
    expect(hand.currentTurnPlayerId).toBe('p2');
    expect(hand.actionLog).toHaveLength(1);
  });

  it('CALLで差額を支払い、次のプレイヤーへ手番を移す', () => {
    const players = buildPlayers();
    const hand = buildHandState({
      currentBet: 300,
      contribThisStreet: { p1: 100, p2: 300, p3: 0 },
      pot: { main: 400, sides: [] },
    });

    const log = applyBasicAction(players, hand, 'CALL');

    expect(log.type).toBe('CALL');
    expect(log.amount).toBe(200);
    expect(players.find((p) => p.id === 'p1')?.stack).toBe(800);
    expect(hand.contribThisStreet.p1).toBe(300);
    expect(hand.pot.main).toBe(600);
    expect(hand.currentTurnPlayerId).toBe('p2');
  });

  it('FOLDしたプレイヤーを手番対象から除外し次のアクティブへ進める', () => {
    const players = buildPlayers();
    players[1].state = 'ALL_IN';
    const hand = buildHandState();

    const log = applyBasicAction(players, hand, 'FOLD');

    expect(log.type).toBe('FOLD');
    expect(players[0].state).toBe('FOLDED');
    expect(hand.currentTurnPlayerId).toBe('p3');
  });

  it('アクション前のHandStateをスナップショットとしてログに保持する', () => {
    const players = buildPlayers();
    const hand = buildHandState({
      currentBet: 300,
      contribThisStreet: { p1: 100, p2: 300, p3: 0 },
      pot: { main: 400, sides: [] },
    });
    const before = cloneHand(hand);

    applyBasicAction(players, hand, 'CALL');

    const snapshot = hand.actionLog.at(-1)?.snapshot;
    expect(snapshot).toEqual(before);
    expect(snapshot?.actionLog).toEqual(before.actionLog);
  });
});

describe('applyBetOrRaise', () => {
  const buildPlayers = (): Player[] => [
    { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
    { id: 'p2', name: 'Bob', seatIndex: 1, stack: 800, state: 'ACTIVE' },
    { id: 'p3', name: 'Carol', seatIndex: 2, stack: 600, state: 'ACTIVE' },
  ];

  const buildHandState = (overrides: Partial<HandState> = {}): HandState => {
    const contribThisStreet = overrides.contribThisStreet ?? { p1: 0, p2: 0, p3: 0 };
    const totalContribThisHand = overrides.totalContribThisHand ?? { ...contribThisStreet };

    return {
      handNumber: 1,
      dealerIndex: 0,
      sbIndex: 1,
      bbIndex: 2,
      street: 'PREFLOP',
      currentTurnPlayerId: 'p1',
      currentBet: 0,
      lastRaiseSize: 200,
      reopenAllowed: true,
      contribThisStreet,
      totalContribThisHand,
      pot: { main: 0, sides: [] },
      actionLog: [],
      ...overrides,
    };
  };

  it('BETで現在ベットと上げ幅を更新し、支払いを反映する', () => {
    const players = buildPlayers();
    const hand = buildHandState();

    const log = applyBetOrRaise(players, hand, 'BET', 400);

    expect(log.type).toBe('BET');
    expect(log.amount).toBe(400);
    expect(hand.currentBet).toBe(400);
    expect(hand.lastRaiseSize).toBe(400);
    expect(players.find((p) => p.id === 'p1')?.stack).toBe(600);
    expect(hand.pot.main).toBe(400);
    expect(hand.currentTurnPlayerId).toBe('p2');
  });

  it('最小レイズを満たすRAISEでcurrentBet/lastRaiseSize/reopenAllowedを更新する', () => {
    const players = buildPlayers();
    const hand = buildHandState({
      currentBet: 400,
      lastRaiseSize: 400,
      contribThisStreet: { p1: 400, p2: 400, p3: 0 },
      pot: { main: 800, sides: [] },
    });

    const log = applyBetOrRaise(players, hand, 'RAISE', 800);

    expect(log.type).toBe('RAISE');
    expect(log.amount).toBe(800);
    expect(hand.currentBet).toBe(800);
    expect(hand.lastRaiseSize).toBe(400);
    expect(hand.reopenAllowed).toBe(true);
    expect(players.find((p) => p.id === 'p1')?.stack).toBe(600);
    expect(hand.pot.main).toBe(1200);
    expect(hand.currentTurnPlayerId).toBe('p2');
  });

  it('最小未満のオールインレイズではreopenAllowedをfalseにする', () => {
    const players = buildPlayers();
    players[2].stack = 200;
    const hand = buildHandState({
      currentBet: 800,
      lastRaiseSize: 400,
      contribThisStreet: { p1: 800, p2: 800, p3: 800 },
      pot: { main: 2400, sides: [] },
      currentTurnPlayerId: 'p3',
    });

    const log = applyBetOrRaise(players, hand, 'RAISE', 1000);

    expect(log.type).toBe('RAISE');
    expect(log.amount).toBe(1000);
    expect(hand.currentBet).toBe(1000);
    expect(hand.lastRaiseSize).toBe(400); // 直前の上げ幅を維持
    expect(hand.reopenAllowed).toBe(false);
    expect(players.find((p) => p.id === 'p3')?.state).toBe('ALL_IN');
  });

  it('BET/RAISEでも実行前のスナップショットを記録する', () => {
    const players = buildPlayers();
    const hand = buildHandState({ contribThisStreet: { p1: 0, p2: 0, p3: 0 } });
    const before = cloneHand(hand);

    applyBetOrRaise(players, hand, 'BET', 400);

    const snapshot = hand.actionLog.at(-1)?.snapshot;
    expect(snapshot).toEqual(before);
  });
});

describe('applyAllIn', () => {
  const buildPlayers = (): Player[] => [
    { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
    { id: 'p2', name: 'Bob', seatIndex: 1, stack: 800, state: 'ACTIVE' },
    { id: 'p3', name: 'Carol', seatIndex: 2, stack: 600, state: 'ACTIVE' },
  ];

  const buildHandState = (overrides: Partial<HandState> = {}): HandState => {
    const contribThisStreet = overrides.contribThisStreet ?? { p1: 0, p2: 0, p3: 0 };
    const totalContribThisHand = overrides.totalContribThisHand ?? { ...contribThisStreet };

    return {
      handNumber: 1,
      dealerIndex: 0,
      sbIndex: 1,
      bbIndex: 2,
      street: 'PREFLOP',
      currentTurnPlayerId: 'p1',
      currentBet: 0,
      lastRaiseSize: 200,
      reopenAllowed: true,
      contribThisStreet,
      totalContribThisHand,
      pot: { main: 0, sides: [] },
      actionLog: [],
      ...overrides,
    };
  };

  it('現在ベット0のALL_INでcurrentBet/lastRaiseSizeを更新する', () => {
    const players = buildPlayers();
    players[0].stack = 600;
    const hand = buildHandState();

    const log = applyAllIn(players, hand);

    expect(log.type).toBe('ALL_IN');
    expect(log.amount).toBe(600);
    expect(players[0].state).toBe('ALL_IN');
    expect(hand.currentBet).toBe(600);
    expect(hand.lastRaiseSize).toBe(600);
    expect(hand.reopenAllowed).toBe(true);
    expect(hand.pot.main).toBe(600);
    expect(hand.currentTurnPlayerId).toBe('p2');
  });

  it('最小レイズを満たすALL_INはreopenAllowedをtrueのまま更新する', () => {
    const players = buildPlayers();
    players[0].stack = 600;
    const hand = buildHandState({
      currentBet: 400,
      lastRaiseSize: 400,
      contribThisStreet: { p1: 400, p2: 400, p3: 0 },
      pot: { main: 800, sides: [] },
    });

    const log = applyAllIn(players, hand);

    expect(log.type).toBe('ALL_IN');
    expect(log.amount).toBe(1000);
    expect(hand.currentBet).toBe(1000);
    expect(hand.lastRaiseSize).toBe(600);
    expect(hand.reopenAllowed).toBe(true);
    expect(hand.pot.main).toBe(1400);
    expect(players[0].state).toBe('ALL_IN');
  });

  it('最小未満のALL_INレイズではreopenAllowedをfalseにする', () => {
    const players = buildPlayers();
    players[2].stack = 200;
    const hand = buildHandState({
      currentBet: 800,
      lastRaiseSize: 400,
      contribThisStreet: { p1: 800, p2: 800, p3: 800 },
      pot: { main: 2400, sides: [] },
      currentTurnPlayerId: 'p3',
    });

    const log = applyAllIn(players, hand);

    expect(log.type).toBe('ALL_IN');
    expect(log.amount).toBe(1000);
    expect(hand.currentBet).toBe(1000);
    expect(hand.lastRaiseSize).toBe(400);
    expect(hand.reopenAllowed).toBe(false);
    expect(players[2].state).toBe('ALL_IN');
    expect(hand.pot.main).toBe(2600);
    expect(hand.currentTurnPlayerId).toBe('p1');
  });

  it('ALL_INでも実行前のスナップショットを保持する', () => {
    const players = buildPlayers();
    players[0].stack = 600;
    const hand = buildHandState();
    const before = cloneHand(hand);

    applyAllIn(players, hand);

    const snapshot = hand.actionLog.at(-1)?.snapshot;
    expect(snapshot).toEqual(before);
  });

  it('最小未満ALL_IN後は既行動者が再度レイズできない', () => {
    const players = buildPlayers();
    players[0].stack = 2000;
    players[1].stack = 2000;
    players[2].stack = 200;

    const hand = buildHandState({
      currentBet: 800,
      lastRaiseSize: 400,
      contribThisStreet: { p1: 800, p2: 800, p3: 800 },
      pot: { main: 2400, sides: [] },
      currentTurnPlayerId: 'p3',
    });

    applyAllIn(players, hand);

    expect(hand.reopenAllowed).toBe(false);
    expect(hand.currentTurnPlayerId).toBe('p1');
    expect(() => applyBetOrRaise(players, hand, 'RAISE', 1200)).toThrow(
      'レイズできません：再オープンが許可されていません。',
    );
  });
});
