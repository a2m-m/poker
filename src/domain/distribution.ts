import type { Player, PlayerId, PotState } from './types';

export type PotWinners = {
  main: PlayerId[];
  sides: PlayerId[][];
};

const sortByButtonProximity = (players: Player[], dealerIndex: number, winnerIds: PlayerId[]) => {
  const seatMap = new Map(players.map((player) => [player.id, player.seatIndex]));
  const playerCount = players.length;

  return [...winnerIds].sort((a, b) => {
    const seatA = seatMap.get(a);
    const seatB = seatMap.get(b);

    if (seatA === undefined || seatB === undefined) {
      throw new Error('勝者に指定されたプレイヤーが存在しません。');
    }

    const distanceA = (seatA - dealerIndex + playerCount) % playerCount;
    const distanceB = (seatB - dealerIndex + playerCount) % playerCount;

    return distanceA - distanceB;
  });
};

const addPayout = (
  payouts: Record<PlayerId, number>,
  players: Player[],
  dealerIndex: number,
  amount: number,
  winnerIds: PlayerId[],
) => {
  if (winnerIds.length === 0 || amount <= 0) return;

  const sortedWinnerIds = sortByButtonProximity(players, dealerIndex, winnerIds);
  const baseShare = Math.floor(amount / sortedWinnerIds.length);
  const remainder = amount % sortedWinnerIds.length;

  sortedWinnerIds.forEach((playerId, index) => {
    const gain = baseShare + (index < remainder ? 1 : 0);
    payouts[playerId] = (payouts[playerId] ?? 0) + gain;
  });
};

/**
 * ポットを分配し、プレイヤーごとの獲得額を返します。
 * 仕様：docs/specification.md セクション7.10「分配と端数処理」準拠
 */
export const distribute = (
  players: Player[],
  dealerIndex: number,
  pot: PotState,
  winners: PotWinners,
): Record<PlayerId, number> => {
  const payouts: Record<PlayerId, number> = {};

  addPayout(payouts, players, dealerIndex, pot.main, winners.main);

  pot.sides.forEach((side, index) => {
    addPayout(payouts, players, dealerIndex, side.amount, winners.sides[index] ?? []);
  });

  return payouts;
};
