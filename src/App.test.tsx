import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
