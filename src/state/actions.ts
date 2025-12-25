import { applyAllIn, applyBasicAction, applyBetOrRaise } from '../domain/actions';
import type { GameState, HandState, Player } from '../domain/types';

export type PlayerActionInput =
  | { type: 'CHECK' | 'CALL' | 'FOLD' | 'ALL_IN' }
  | { type: 'BET' | 'RAISE'; amount: number };

const cloneGameState = (state: GameState): GameState => JSON.parse(JSON.stringify(state)) as GameState;

const capturePlayersSnapshot = (players: Player[]): Player[] => JSON.parse(JSON.stringify(players)) as Player[];

const ensureLastLogHasSnapshots = (hand: HandState, handSnapshot: HandState, playersSnapshot: Player[]) => {
  const lastLog = hand.actionLog.at(-1);
  if (!lastLog) return;

  if (!lastLog.snapshot) {
    lastLog.snapshot = handSnapshot;
  }
  if (!lastLog.playersSnapshot) {
    lastLog.playersSnapshot = playersSnapshot;
  }
};

export const applyPlayerActionToState = (state: GameState, action: PlayerActionInput): GameState => {
  const baseSnapshot = cloneGameState(state);
  const next = cloneGameState(state);

  switch (action.type) {
    case 'CHECK':
    case 'CALL':
    case 'FOLD': {
      applyBasicAction(next.players, next.hand, action.type);
      break;
    }
    case 'ALL_IN': {
      applyAllIn(next.players, next.hand);
      break;
    }
    case 'BET':
    case 'RAISE': {
      applyBetOrRaise(next.players, next.hand, action.type, action.amount);
      break;
    }
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unsupported action: ${exhaustiveCheck}`);
    }
  }

  ensureLastLogHasSnapshots(next.hand, baseSnapshot.hand, capturePlayersSnapshot(baseSnapshot.players));

  return next;
};
