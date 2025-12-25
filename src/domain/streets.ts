import { calcFirstToActPlayerId } from './turns';
import type { ActionLogEntry, GameSettings, HandState, Player, Street } from './types';

const nextStreet = (street: Street): Street => {
  switch (street) {
    case 'PREFLOP':
      return 'FLOP';
    case 'FLOP':
      return 'TURN';
    case 'TURN':
      return 'RIVER';
    case 'RIVER':
      return 'SHOWDOWN';
    default:
      return street;
  }
};

const buildEmptyContrib = (players: Player[]): Record<string, number> =>
  players.reduce<Record<string, number>>((acc, player) => {
    acc[player.id] = 0;
    return acc;
  }, {});

const haveAllActivePlayersActed = (players: Player[], hand: HandState): boolean => {
  const activePlayers = players.filter((player) => player.state === 'ACTIVE');
  const actedPlayerIds = new Set(
    hand.actionLog
      .filter((entry) => entry.street === hand.street && entry.playerId)
      .map((entry) => entry.playerId as string),
  );
  return activePlayers.every((player) => actedPlayerIds.has(player.id));
};

export const shouldAdvanceStreet = (players: Player[], hand: HandState): boolean => {
  const activePlayers = players.filter((player) => player.state === 'ACTIVE');
  if (activePlayers.length === 0) return false;

  const everyoneReachedBet = activePlayers.every(
    (player) => (hand.contribThisStreet[player.id] ?? 0) === hand.currentBet,
  );
  if (!everyoneReachedBet) return false;

  return haveAllActivePlayersActed(players, hand);
};

export const advanceStreet = (
  players: Player[],
  hand: HandState,
  settings: Pick<GameSettings, 'bb'>,
): ActionLogEntry => {
  if (!shouldAdvanceStreet(players, hand)) {
    throw new Error('ストリート終了条件を満たしていません。');
  }

  const next = nextStreet(hand.street);

  hand.street = next;
  hand.currentBet = 0;
  hand.lastRaiseSize = settings.bb;
  hand.reopenAllowed = true;
  hand.contribThisStreet = buildEmptyContrib(players);
  hand.currentTurnPlayerId = calcFirstToActPlayerId(
    players,
    next,
    hand.dealerIndex,
    hand.bbIndex,
  );

  const log: ActionLogEntry = {
    seq: hand.actionLog.length + 1,
    type: 'ADVANCE_STREET',
    street: next,
  };
  hand.actionLog.push(log);
  return log;
};
