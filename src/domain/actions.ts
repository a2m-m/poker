import { calcCallNeeded } from './bets';
import type { ActionType, HandState, Player } from './types';

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
