import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./state/persistence', async () => {
  const actual = await vi.importActual<typeof import('./state/persistence')>(
    './state/persistence',
  );
  const { createNewGame } = await import('./domain/game');

  const mockGameState = createNewGame(
    { sb: 50, bb: 100, roundingRule: 'BUTTON_NEAR', burnCard: true },
    [
      { id: 'p1', name: 'Alice', stack: 1000 },
      { id: 'p2', name: 'Bob', stack: 1000 },
    ],
  );

  return {
    ...actual,
    loadPersistedGameState: () => ({ state: mockGameState, wasCorrupted: false }),
  };
});

import App from './App';

describe('App', () => {
  it('主要ルートのリンクを表示する', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Poker Dealer App' })).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'アプリ内ルート一覧' });
    const routeNames = ['ホーム', 'セットアップ', 'テーブル', 'ショーダウン', '配当結果', 'ログ', '設定'];

    routeNames.forEach((name) => {
      expect(within(navigation).getByRole('link', { name: new RegExp(name) })).toBeInTheDocument();
    });
  });
});
