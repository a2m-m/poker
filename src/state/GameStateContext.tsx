import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { GameState } from '../domain/types';

const STORAGE_KEY = 'poker_dealer_v1_game_state';

const isBrowser = typeof window !== 'undefined';

const loadPersistedState = (): GameState | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameState;
  } catch (error) {
    console.warn('保存済みのゲーム状態の読み込みに失敗しました', error);
    return null;
  }
};

const persistState = (state: GameState | null) => {
  if (!isBrowser) return;
  if (state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

export type GameStateContextValue = {
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  clearGameState: () => void;
};

const GameStateContext = createContext<GameStateContextValue | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameStateState] = useState<GameState | null>(() => loadPersistedState());

  const value = useMemo(
    () => ({
      gameState,
      setGameState: (state: GameState) => {
        setGameStateState(state);
        persistState(state);
      },
      clearGameState: () => {
        setGameStateState(null);
        persistState(null);
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
