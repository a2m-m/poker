import type { HandState, PlayerId } from './types';

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
