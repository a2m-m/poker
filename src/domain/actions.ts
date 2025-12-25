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
