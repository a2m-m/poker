import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewGame } from '../domain/game';
import { type GameSettings } from '../domain/types';
import { storageKeys } from '../domain/storage';
import { clearPersistedGameState, loadPersistedGameState, persistGameState } from './persistence';

const baseSettings: GameSettings = {
  sb: 100,
  bb: 200,
  roundingRule: 'BUTTON_NEAR',
  burnCard: true,
};

const buildGameState = () =>
  createNewGame(baseSettings, [
    { id: 'p1', name: 'Alice', stack: 10000 },
    { id: 'p2', name: 'Bob', stack: 10000 },
  ]);

describe('persistence helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', globalThis.window);
    window.localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(loadPersistedGameState()).toBeNull();
  });

  it('persists and restores a game state', () => {
    const gameState = buildGameState();

    persistGameState(gameState);

    const restored = loadPersistedGameState();

    expect(restored?.players[0].name).toBe('Alice');
    expect(restored?.hand.currentBet).toBeGreaterThan(0);
  });

  it('ignores malformed JSON and clears storage', () => {
    window.localStorage.setItem(storageKeys.gameState, '{invalid-json');

    expect(loadPersistedGameState()).toBeNull();
    expect(window.localStorage.getItem(storageKeys.gameState)).toBeNull();
  });

  it('clears stored state explicitly', () => {
    const gameState = buildGameState();
    persistGameState(gameState);

    clearPersistedGameState();

    expect(loadPersistedGameState()).toBeNull();
  });
});
