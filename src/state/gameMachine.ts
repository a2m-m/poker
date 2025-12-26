import { useCallback, useMemo } from 'react';
import { distribute } from '../domain/distribution';
import { startNextHand } from '../domain/game';
import { buildPotBreakdown } from '../domain/pot';
import type { GameState, PotWinners } from '../domain/types';
import { useGameState } from './GameStateContext';
import { selectGamePhase } from './selectors';

const buildPayoutResult = (game: GameState, winners: PotWinners) => {
  const { players, hand } = game;
  const { potState, breakdown } = buildPotBreakdown(players, { hand });
  const payouts = distribute(players, hand.dealerIndex, potState, winners);
  const updatedPlayers = players.map((player) => ({
    ...player,
    stack: player.stack + (payouts[player.id] ?? 0),
  }));

  return {
    gameState: {
      ...game,
      players: updatedPlayers,
      hand: {
        ...hand,
        street: 'PAYOUT' as const,
        pot: potState,
        payoutResult: {
          dealerIndex: hand.dealerIndex,
          pot: potState,
          breakdown,
          winners,
          payouts,
        },
      },
    },
  } as const;
};

export const useGameMachine = () => {
  const { gameState, updateGameState } = useGameState();
  const currentPhase = selectGamePhase(gameState);

  const payoutResult = useMemo(() => gameState?.hand.payoutResult ?? null, [gameState]);

  const settleShowdown = useCallback(
    (winners: PotWinners) => {
      updateGameState((prev) => {
        if (!prev) return prev;
        const { gameState: next } = buildPayoutResult(prev, winners);
        return next;
      });
    },
    [updateGameState],
  );

  const goToShowdown = useCallback(
    () =>
      updateGameState((prev) => {
        if (!prev) return prev;
        if (prev.hand.street === 'SHOWDOWN') return prev;
        return {
          ...prev,
          hand: {
            ...prev.hand,
            street: 'SHOWDOWN',
          },
        } satisfies GameState;
      }),
    [updateGameState],
  );

  const proceedToNextHand = useCallback(() => {
    updateGameState((prev) => {
      if (!prev) return prev;
      return startNextHand(prev);
    });
  }, [updateGameState]);

  const returnToTablePhase = useCallback(() => {
    updateGameState((prev) => {
      if (!prev) return prev;
      if (prev.hand.street !== 'SHOWDOWN' && prev.hand.street !== 'PAYOUT') return prev;
      return {
        ...prev,
        hand: {
          ...prev.hand,
          street: 'RIVER',
        },
      } satisfies GameState;
    });
  }, [updateGameState]);

  const returnToShowdownPhase = useCallback(() => {
    updateGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hand: {
          ...prev.hand,
          street: 'SHOWDOWN',
        },
      } satisfies GameState;
    });
  }, [updateGameState]);

  return {
    payoutResult,
    settleShowdown,
    goToShowdown,
    proceedToNextHand,
    gameState,
    currentPhase,
    returnToTablePhase,
    returnToShowdownPhase,
  };
};
