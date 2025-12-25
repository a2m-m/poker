import { applyPayment, calcCallNeeded } from './bets';
import type { ActionLogEntry, ActionType, HandState, Player, PlayerId } from './types';

type HandForAction = Pick<HandState, 'currentBet' | 'contribThisStreet' | 'reopenAllowed'>;

const isActive = (player: Player): boolean => player.state === 'ACTIVE';

const canCheck = (callNeeded: number): boolean => callNeeded === 0;

const canCall = (callNeeded: number, stack: number): boolean => callNeeded > 0 && stack > 0;

const canBet = (currentBet: number, stack: number): boolean => currentBet === 0 && stack > 0;

const canRaise = (hand: HandForAction, stack: number): boolean =>
  hand.currentBet > 0 && hand.reopenAllowed && stack > 0;

const canFold = (player: Player): boolean => player.state === 'ACTIVE';

const canAllIn = (stack: number): boolean => stack > 0;

/**
 * プレイヤーが選択できるアクションを判定します。
 * 仕様：docs/specification.md セクション7.3「アクション可否」準拠
 */
export const getAvailableActions = (hand: HandForAction, player: Player): ActionType[] => {
  if (!isActive(player)) return [];

  const callNeeded = calcCallNeeded(hand, player.id);
  const actions: ActionType[] = [];

  if (canCheck(callNeeded)) actions.push('CHECK');
  if (canCall(callNeeded, player.stack)) actions.push('CALL');
  if (canBet(hand.currentBet, player.stack)) actions.push('BET');
  if (canRaise(hand, player.stack)) actions.push('RAISE');
  if (canFold(player)) actions.push('FOLD');
  if (canAllIn(player.stack)) actions.push('ALL_IN');

  return actions;
};

const findPlayerById = (players: Player[], playerId: PlayerId): Player => {
  const player = players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`player not found: ${playerId}`);
  }
  return player;
};

const findNextActivePlayerId = (players: Player[], currentSeatIndex: number): PlayerId | null => {
  const sorted = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
  const currentIndex = sorted.findIndex((player) => player.seatIndex === currentSeatIndex);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;

  for (let i = 1; i <= sorted.length; i += 1) {
    const candidate = sorted[(startIndex + i) % sorted.length];
    if (candidate.state === 'ACTIVE') {
      return candidate.id;
    }
  }

  return null;
};

type BasicAction = 'CHECK' | 'CALL' | 'FOLD';

const appendActionLog = (
  hand: HandState,
  entry: Omit<ActionLogEntry, 'seq'>,
): ActionLogEntry => {
  const logged: ActionLogEntry = { ...entry, seq: hand.actionLog.length + 1 };
  hand.actionLog.push(logged);
  return logged;
};

const assertBettable = (hand: HandState) => {
  if (hand.currentBet > 0) {
    throw new Error('ベットできません：現在ベットが存在します。');
  }
};

const assertRaisable = (hand: HandState) => {
  if (hand.currentBet === 0) {
    throw new Error('レイズできません：現在ベットがありません。');
  }
  if (!hand.reopenAllowed) {
    throw new Error('レイズできません：再オープンが許可されていません。');
  }
};

export const applyBasicAction = (
  players: Player[],
  hand: HandState,
  action: BasicAction,
): ActionLogEntry => {
  const player = findPlayerById(players, hand.currentTurnPlayerId);
  const callNeeded = calcCallNeeded(hand, player.id);
  let paid: number | undefined;

  switch (action) {
    case 'CHECK': {
      if (callNeeded > 0) {
        throw new Error('チェックできません：コールが必要です。');
      }
      break;
    }
    case 'CALL': {
      if (callNeeded <= 0) {
        throw new Error('コール不要の状態です。');
      }
      paid = applyPayment(players, hand, player.id, callNeeded);
      break;
    }
    case 'FOLD': {
      if (player.state !== 'ACTIVE') {
        throw new Error('フォールドできません：アクティブではありません。');
      }
      player.state = 'FOLDED';
      break;
    }
  }

  const log = appendActionLog(hand, {
    type: action,
    playerId: player.id,
    amount: paid,
    street: hand.street,
  });

  const nextPlayerId = findNextActivePlayerId(players, player.seatIndex);
  if (nextPlayerId) {
    hand.currentTurnPlayerId = nextPlayerId;
  }

  return log;
};

type BetOrRaise = 'BET' | 'RAISE';

const validateBetOrRaiseAmount = (
  action: BetOrRaise,
  hand: HandState,
  player: Player,
  amount: number,
) => {
  const contributed = hand.contribThisStreet[player.id] ?? 0;
  const maxReachable = contributed + player.stack;

  if (amount <= hand.currentBet) {
    throw new Error('レイズ額は現在ベットを上回る必要があります。');
  }

  if (amount > maxReachable) {
    throw new Error('スタックを超える額は指定できません。');
  }

  const minBet = hand.lastRaiseSize;
  const minRaiseTo = hand.currentBet + hand.lastRaiseSize;

  if (action === 'BET') {
    if (maxReachable >= minBet && amount < minBet) {
      throw new Error('ベット額が最小ベット未満です。');
    }
  } else {
    if (maxReachable <= hand.currentBet) {
      throw new Error('レイズできません：スタックが不足しています。');
    }
    if (maxReachable >= minRaiseTo && amount < minRaiseTo) {
      throw new Error('レイズ額が最小レイズ未満です。');
    }
  }
};

export const applyBetOrRaise = (
  players: Player[],
  hand: HandState,
  action: BetOrRaise,
  amount: number,
): ActionLogEntry => {
  const player = findPlayerById(players, hand.currentTurnPlayerId);

  if (action === 'BET') {
    assertBettable(hand);
  } else {
    assertRaisable(hand);
  }

  validateBetOrRaiseAmount(action, hand, player, amount);

  const prevCurrentBet = hand.currentBet;
  const prevLastRaise = hand.lastRaiseSize;
  const contributed = hand.contribThisStreet[player.id] ?? 0;
  const payAmount = Math.max(0, amount - contributed);

  applyPayment(players, hand, player.id, payAmount);

  const reached = hand.contribThisStreet[player.id] ?? 0;
  const raiseSize = reached - prevCurrentBet;
  const isFullRaise = raiseSize >= prevLastRaise;

  hand.currentBet = Math.max(hand.currentBet, reached);

  if (action === 'BET' || isFullRaise) {
    hand.lastRaiseSize = raiseSize;
    hand.reopenAllowed = true;
  } else {
    hand.reopenAllowed = false;
  }

  const log = appendActionLog(hand, {
    type: action,
    playerId: player.id,
    amount: reached,
    street: hand.street,
  });

  const nextPlayerId = findNextActivePlayerId(players, player.seatIndex);
  if (nextPlayerId) {
    hand.currentTurnPlayerId = nextPlayerId;
  }

  return log;
};

export const applyAllIn = (
  players: Player[],
  hand: HandState,
): ActionLogEntry => {
  const player = findPlayerById(players, hand.currentTurnPlayerId);

  if (player.stack <= 0) {
    throw new Error('オールインできません：スタックがありません。');
  }

  const prevCurrentBet = hand.currentBet;
  const prevLastRaise = hand.lastRaiseSize;
  const contributed = hand.contribThisStreet[player.id] ?? 0;

  applyPayment(players, hand, player.id, player.stack);

  const reached = hand.contribThisStreet[player.id] ?? 0;

  if (prevCurrentBet === 0) {
    hand.currentBet = reached;
    hand.lastRaiseSize = reached;
    hand.reopenAllowed = true;
  } else if (reached > prevCurrentBet) {
    hand.currentBet = reached;
    const raiseSize = reached - prevCurrentBet;
    const isFullRaise = raiseSize >= prevLastRaise;

    if (isFullRaise) {
      hand.lastRaiseSize = raiseSize;
      hand.reopenAllowed = true;
    } else {
      hand.reopenAllowed = false;
    }
  }

  const log = appendActionLog(hand, {
    type: 'ALL_IN',
    playerId: player.id,
    amount: reached,
    street: hand.street,
  });

  const nextPlayerId = findNextActivePlayerId(players, player.seatIndex);
  if (nextPlayerId) {
    hand.currentTurnPlayerId = nextPlayerId;
  }

  return log;
};
