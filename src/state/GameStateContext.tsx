import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { GameState } from '../domain/types';

export type GameStateContextValue = {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  clearGameState: () => void;
};

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const value = useMemo(
    () => ({
      gameState,
      setGameState,
      clearGameState: () => setGameState(null),
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
