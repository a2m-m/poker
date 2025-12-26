import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { distribute } from '../domain/distribution';
import { startNextHand } from '../domain/game';
import { buildPotBreakdown } from '../domain/pot';
import type { GameState, PotWinners } from '../domain/types';
import { useGameState } from './GameStateContext';

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
  const navigate = useNavigate();
  const { gameState, updateGameState } = useGameState();

  const payoutResult = useMemo(() => gameState?.hand.payoutResult ?? null, [gameState]);

  const settleShowdown = useCallback(
    (winners: PotWinners) => {
      updateGameState((prev) => {
        if (!prev) return prev;
        const { gameState: next } = buildPayoutResult(prev, winners);
        return next;
      });
      navigate('/payout');
    },
    [navigate, updateGameState],
  );

  const goToShowdown = useCallback(() => navigate('/showdown'), [navigate]);

  const proceedToNextHand = useCallback(() => {
    updateGameState((prev) => {
      if (!prev) return prev;
      return startNextHand(prev);
    });
    navigate('/table');
  }, [navigate, updateGameState]);

  return { payoutResult, settleShowdown, goToShowdown, proceedToNextHand, gameState };
};
