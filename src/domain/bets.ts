import type { HandState, Player, PlayerId } from './types';

export const calcCallNeeded = (
  hand: Pick<HandState, 'currentBet' | 'contribThisStreet'>,
  playerId: PlayerId,
): number => {
  const contributed = hand.contribThisStreet[playerId] ?? 0;
  return Math.max(0, hand.currentBet - contributed);
};

export const calcMinRaiseTo = (
  hand: Pick<HandState, 'currentBet' | 'lastRaiseSize' | 'reopenAllowed'>,
): number | null => {
  if (hand.currentBet === 0) return null;
  if (!hand.reopenAllowed) return null;
  return hand.currentBet + hand.lastRaiseSize;
};

export const applyPayment = (
  players: Player[],
  hand: Pick<HandState, 'contribThisStreet' | 'pot'>,
  playerId: PlayerId,
  amount: number,
): number => {
  const player = players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`player not found: ${playerId}`);
  }

  const pay = Math.max(0, Math.min(amount, player.stack));

  player.stack -= pay;
  hand.contribThisStreet[playerId] = (hand.contribThisStreet[playerId] ?? 0) + pay;
  hand.pot.main += pay;

  if (player.stack === 0) {
    player.state = 'ALL_IN';
  }

  return pay;
};
