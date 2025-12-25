import { getActivePlayerSeatIndices } from './positions';
import type { Player, PlayerId, Street } from './types';

const findPlayerIdBySeatIndex = (players: Player[], seatIndex: number): PlayerId | undefined =>
  players.find((player) => player.seatIndex === seatIndex && player.state === 'ACTIVE')?.id;

export const calcFirstToActPlayerId = (
  players: Player[],
  street: Street,
  dealerIndex: number,
  bbIndex: number,
): PlayerId => {
  const activeSeats = getActivePlayerSeatIndices(players);
  if (activeSeats.length === 0) {
    throw new Error('アクティブなプレイヤーが存在しません。');
  }

  const activeSeatSet = new Set(activeSeats);
  const playerCount = players.length;
  const startSeat = street === 'PREFLOP' ? (bbIndex + 1) % playerCount : (dealerIndex + 1) % playerCount;

  for (let i = 0; i < playerCount; i += 1) {
    const seatIndex = (startSeat + i) % playerCount;
    if (!activeSeatSet.has(seatIndex)) {
      continue;
    }
    const playerId = findPlayerIdBySeatIndex(players, seatIndex);
    if (playerId) {
      return playerId;
    }
  }

  const fallback = players.find((player) => player.state === 'ACTIVE');
  if (!fallback) {
    throw new Error('アクティブなプレイヤーが存在しません。');
  }
  return fallback.id;
};
