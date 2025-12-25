import type { HandState, PlayerId } from './types';

export const calcCallNeeded = (
  hand: Pick<HandState, 'currentBet' | 'contribThisStreet'>,
  playerId: PlayerId,
): number => {
  const contributed = hand.contribThisStreet[playerId] ?? 0;
  return Math.max(0, hand.currentBet - contributed);
};
