import type { Player } from './types';

export type BlindPositions = {
  sbIndex: number;
  bbIndex: number;
};

export const getActivePlayerSeatIndices = (players: Player[]): number[] =>
  players
    .filter((player) => player.state === 'ACTIVE')
    .map((player) => player.seatIndex)
    .sort((a, b) => a - b);

export const calcBlindIndices = (players: Player[], dealerIndex: number): BlindPositions => {
  const activeSeats = getActivePlayerSeatIndices(players);

  if (activeSeats.length < 2) {
    throw new Error('ゲーム開始には2人以上が必要です。');
  }

  const playerCount = activeSeats.length;
  const dealerPosition = activeSeats.indexOf(dealerIndex);
  const buttonPosition = dealerPosition >= 0 ? dealerPosition : 0;

  if (playerCount === 2) {
    const sbIndex = activeSeats[buttonPosition];
    const bbIndex = activeSeats[(buttonPosition + 1) % playerCount];
    return { sbIndex, bbIndex };
  }

  const sbIndex = activeSeats[(buttonPosition + 1) % playerCount];
  const bbIndex = activeSeats[(buttonPosition + 2) % playerCount];
  return { sbIndex, bbIndex };
};
