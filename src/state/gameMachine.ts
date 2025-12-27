import { useCallback, useMemo } from 'react';
import { distribute } from '../domain/distribution';
import { startNextHand } from '../domain/game';
import { buildPotBreakdown } from '../domain/pot';
import type { GameState, PotWinners } from '../domain/types';
import { useGameState } from './GameStateContext';
import { selectGamePhase, type GamePhase } from './selectors';

type PreviousPhaseAvailability = {
  canReturn: boolean;
  reason: string | null;
  targetPhase: GamePhase | null;
  targetPath: '/table' | '/showdown';
};

const describePreviousPhaseAvailability = (gameState: GameState | null): PreviousPhaseAvailability => {
  const phase = selectGamePhase(gameState);

  if (!gameState || !phase) {
    return {
      canReturn: false,
      reason: 'ゲーム状態が存在しないため戻れません。',
      targetPhase: null,
      targetPath: '/table',
    };
  }

  if (phase === 'TABLE') {
    return {
      canReturn: false,
      reason: 'テーブル進行中は前フェーズがありません。',
      targetPhase: 'TABLE',
      targetPath: '/table',
    };
  }

  if (phase === 'SHOWDOWN') {
    return {
      canReturn: true,
      reason: null,
      targetPhase: 'TABLE',
      targetPath: '/table',
    };
  }

  return {
    canReturn: true,
    reason: null,
    targetPhase: 'SHOWDOWN',
    targetPath: '/showdown',
  } satisfies PreviousPhaseAvailability;
};

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
  const previousPhaseAvailability = useMemo(
    () => describePreviousPhaseAvailability(gameState),
    [gameState],
  );

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

  const goToPreviousPhase = useCallback(() => {
    updateGameState((prev) => {
      const availability = describePreviousPhaseAvailability(prev);

      if (!prev || !availability.canReturn || !availability.targetPhase) return prev;

      if (availability.targetPhase === 'TABLE') {
        return {
          ...prev,
          hand: {
            ...prev.hand,
            street: 'RIVER',
          },
        } satisfies GameState;
      }

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
    previousPhaseAvailability,
    goToPreviousPhase,
  };
};
