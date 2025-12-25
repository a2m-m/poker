import { type GameState } from '../domain/types';

export const hasSavedGameState = (gameState: GameState | null): boolean => !!gameState;

export const hasEnoughPlayers = (gameState: GameState | null): boolean =>
  (gameState?.players.length ?? 0) >= 2;

export const hasEnoughPlayersCount = (count: number): boolean => count >= 2;

export const getResumeAvailability = (gameState: GameState | null) => {
  const hasSave = hasSavedGameState(gameState);
  const enoughPlayers = hasEnoughPlayers(gameState);

  if (!hasSave) {
    return {
      canResume: false,
      reason: '保存済みのゲーム状態が見つかりません。',
    };
  }

  if (!enoughPlayers) {
    return {
      canResume: false,
      reason: '参加人数が2人未満のため再開できません。',
    };
  }

  return {
    canResume: true,
    reason: null as string | null,
  };
};
