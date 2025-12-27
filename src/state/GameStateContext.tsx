import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { GameState } from '../domain/types';
import {
  clearPersistedGameState,
  loadPersistedGameState,
  persistGameState,
} from './persistence';

export type GameStateContextValue = {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateGameState: (updater: (prev: GameState | null) => GameState | null) => void;
  clearGameState: () => void;
  hasCorruptedSave: boolean;
};

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [loadResult] = useState(() => loadPersistedGameState());
  const [gameState, setGameStateState] = useState<GameState | null>(() => loadResult.state);
  const [hasCorruptedSave, setHasCorruptedSave] = useState(loadResult.wasCorrupted);

  const value = useMemo(
    () => ({
      gameState,
      setGameState: (state: GameState) => {
        setGameStateState(state);
        persistGameState(state);
        setHasCorruptedSave(false);
      },
      updateGameState: (updater: (prev: GameState | null) => GameState | null) => {
        setGameStateState((prev) => {
          const next = updater(prev);
          persistGameState(next);
          setHasCorruptedSave(false);
          return next;
        });
      },
      clearGameState: () => {
        setGameStateState(null);
        clearPersistedGameState();
        setHasCorruptedSave(false);
      },
      hasCorruptedSave,
    }),
    [gameState, hasCorruptedSave],
  );

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGameState = (): GameStateContextValue => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState は GameStateProvider 配下でのみ使用してください');
  }
  return context;
};
