import { shouldAdvanceStreet } from './streets';
import type { HandState, Player } from './types';

type HandEndReason = 'PAYOUT' | 'SHOWDOWN';

const getRemainingPlayers = (players: Player[]): Player[] =>
  players.filter((player) => player.state !== 'FOLDED');

/**
 * ハンド終了タイミングを判定します。
 * 仕様：docs/specification.md セクション7.8「ハンド終了」準拠
 */
export const detectHandEnd = (players: Player[], hand: HandState): HandEndReason | null => {
  const remainingPlayers = getRemainingPlayers(players);
  if (remainingPlayers.length <= 1) {
    return 'PAYOUT';
  }

  if (hand.street === 'RIVER' && shouldAdvanceStreet(players, hand)) {
    return 'SHOWDOWN';
  }

  return null;
};
