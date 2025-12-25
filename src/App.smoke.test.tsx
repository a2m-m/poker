import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { storageKeys } from './domain/storage';
import App from './App';
import { ToastProvider } from './components/Toast';
import { GameStateProvider } from './state/GameStateContext';

describe('主要画面スモークテスト', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  it('ホームから主要導線をたどり、保存データで再開できる', async () => {
    const renderApp = () =>
      render(
        <ToastProvider>
          <GameStateProvider>
            <App />
          </GameStateProvider>
        </ToastProvider>,
      );

    const { unmount } = renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'ConfirmDialog を開く' }));
    expect(screen.getByRole('dialog', { name: '本当に削除しますか？' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '削除する' }));
    expect(await screen.findByRole('status')).toHaveTextContent('削除を実行しました');

    fireEvent.click(screen.getByRole('button', { name: '新規ゲームを開始' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'セットアップ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'テーブルを開く' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'テーブル' })).toBeInTheDocument();

    expect(window.localStorage.getItem(storageKeys.gameState)).not.toBeNull();

    unmount();
    window.location.hash = '#/';

    renderApp();
    const resumeButton = await screen.findByRole('button', { name: '前回を再開（デモ）' });
    expect(resumeButton).toBeEnabled();

    fireEvent.click(resumeButton);
    const resumeDialog = await screen.findByRole('dialog', { name: '前回の状態で再開しますか？' });
    fireEvent.click(within(resumeDialog).getByRole('button', { name: 'テーブルに移動する' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'テーブル' })).toBeInTheDocument();
  });
});
