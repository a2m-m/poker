import { storageKeys } from '../domain/storage';
import { type GameState } from '../domain/types';

const isBrowser = typeof window !== 'undefined';

const isGameStateLike = (value: unknown): value is GameState => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<GameState>;

  return (
    typeof data.settings === 'object' &&
    Array.isArray(data.players) &&
    typeof data.hand === 'object'
  );
};

export type PersistedStateLoadResult = {
  state: GameState | null;
  wasCorrupted: boolean;
};

export const loadPersistedGameState = (): PersistedStateLoadResult => {
  if (!isBrowser) return { state: null, wasCorrupted: false };

  const raw = window.localStorage.getItem(storageKeys.gameState);
  if (!raw) return { state: null, wasCorrupted: false };

  try {
    const parsed = JSON.parse(raw);
    if (!isGameStateLike(parsed)) {
      window.localStorage.removeItem(storageKeys.gameState);
      return { state: null, wasCorrupted: true };
    }
    return { state: parsed, wasCorrupted: false };
  } catch (error) {
    console.warn('保存済みのゲーム状態の読み込みに失敗しました', error);
    window.localStorage.removeItem(storageKeys.gameState);
    return { state: null, wasCorrupted: true };
  }
};

export const persistGameState = (state: GameState | null) => {
  if (!isBrowser) return;

  if (state) {
    window.localStorage.setItem(storageKeys.gameState, JSON.stringify(state));
  } else {
    window.localStorage.removeItem(storageKeys.gameState);
  }
};

export const clearPersistedGameState = () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(storageKeys.gameState);
};
