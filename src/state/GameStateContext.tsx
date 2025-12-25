import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { GameState } from '../domain/types';
import { clearPersistedGameState, loadPersistedGameState, persistGameState } from './persistence';

export type GameStateContextValue = {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateGameState: (updater: (prev: GameState | null) => GameState | null) => void;
  clearGameState: () => void;
};

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameStateState] = useState<GameState | null>(() => loadPersistedGameState());

  const value = useMemo(
    () => ({
      gameState,
      setGameState: (state: GameState) => {
        setGameStateState(state);
        persistGameState(state);
      },
      updateGameState: (updater: (prev: GameState | null) => GameState | null) => {
        setGameStateState((prev) => {
          const next = updater(prev);
          persistGameState(next);
          return next;
        });
      },
      clearGameState: () => {
        setGameStateState(null);
        clearPersistedGameState();
      },
    }),
    [gameState],
  );

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

export const useGameState = (): GameStateContextValue => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState は GameStateProvider 配下でのみ使用してください');
  }
  return context;
};
