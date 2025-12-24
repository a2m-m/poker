import { describe, expect, it } from 'vitest';
import { storageKeyList, storageKeys, storagePolicy } from './storage';

describe('storage constants', () => {
  it('namespaces all key values', () => {
    expect(storageKeys.gameState).toBe('poker_dealer_v1_game_state');
    expect(storageKeys.settings).toBe('poker_dealer_v1_settings');
  });

  it('lists every key exactly once', () => {
    expect(storageKeyList).toEqual([
      storageKeys.gameState,
      storageKeys.settings,
    ]);
  });

  it('declares save triggers for each key', () => {
    expect(storagePolicy.gameState.triggers).toContain('onActionCommitted');
    expect(storagePolicy.settings.triggers).toContain('onSettingsUpdated');
  });
});
