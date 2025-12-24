const STORAGE_PREFIX = 'poker_dealer_v1';

const createKey = (suffix: string) => `${STORAGE_PREFIX}_${suffix}`;

export const storageKeys = {
  gameState: createKey('game_state'),
  settings: createKey('settings'),
} as const;

export type StorageKeyName = keyof typeof storageKeys;
export type StorageKeyValue = (typeof storageKeys)[StorageKeyName];

export const storageKeyList: StorageKeyValue[] = Object.values(storageKeys);

export type StorageSaveTrigger =
  | 'onActionCommitted'
  | 'onSettingsUpdated';

type StoragePolicy = {
  [Name in StorageKeyName]: {
    key: (typeof storageKeys)[Name];
    triggers: StorageSaveTrigger[];
    description: string;
  };
};

export const storagePolicy: StoragePolicy = {
  gameState: {
    key: storageKeys.gameState,
    triggers: ['onActionCommitted'],
    description: '各アクション確定後にゲーム状態を保存する',
  },
  settings: {
    key: storageKeys.settings,
    triggers: ['onSettingsUpdated'],
    description: '設定変更のタイミングで保存する',
  },
};
