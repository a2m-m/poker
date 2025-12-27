import './App.css';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useToast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { LogPage } from './pages/LogPage';
import { PreviewPage } from './pages/PreviewPage';
import { PayoutPage } from './pages/PayoutPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';
import { ShowdownPage } from './pages/ShowdownPage';
import { TablePage } from './pages/TablePage';
import { useGameState } from './state/GameStateContext';
import { getResumeAvailability } from './state/selectors';
import { usePhaseNavigation } from './state/usePhaseNavigation';
import viteLogo from '/vite.svg';

type PageInfo = {
  path: string;
  title: string;
  description: string;
  element: ReactNode;
};

const basePages: PageInfo[] = [
  {
    path: '/',
    title: 'ホーム',
    description: '新規開始・再開・リセットの起点となるトップページです。',
    element: <HomePage description="新規開始・再開・リセットの起点となるトップページです。" />,
  },
  {
    path: '/setup',
    title: 'セットアップ',
    description: 'プレイヤーとブラインドを設定し、テーブルへ進む準備を整えます。',
    element: <SetupPage description="プレイヤーとブラインドを設定し、テーブルへ進む準備を整えます。" />,
  },
  {
    path: '/table',
    title: 'テーブル',
    description: '進行中のハンドを確認し、アクションを入力するメインビューです。',
    element: <TablePage description="進行中のハンドを確認し、アクションを入力するメインビューです。" />,
  },
  {
    path: '/showdown',
    title: 'ショーダウン',
    description: 'メイン/サイドポットごとに勝者を選び、配当に進む前の確認を行います。',
    element: <ShowdownPage description="メイン/サイドポットごとに勝者を選び、配当に進む前の確認を行います。" />,
  },
  {
    path: '/payout',
    title: '配当結果',
    description: '各ポットの配当結果とスタック更新を一覧し、次のハンドへ進む導線をまとめます。',
    element: <PayoutPage description="各ポットの配当結果とスタック更新を一覧し、次のハンドへ進む導線をまとめます。" />,
  },
  {
    path: '/log',
    title: 'ログ',
    description: 'アクション履歴を時系列で確認し、直前の入力を振り返ります。',
    element: <LogPage description="アクション履歴を時系列で確認し、直前の入力を振り返ります。" />,
  },
  {
    path: '/settings',
    title: '設定',
    description: '保存/復元や表示オプションを調整し、ハンド進行に影響する設定を管理します。',
    element: <SettingsPage description="保存/復元や表示オプションを調整し、ハンド進行に影響する設定を管理します。" />,
  },
];

const previewPage: PageInfo = {
  path: '/preview',
  title: 'プレビュー',
  description: 'GameState のダミーを切り替えて各ページの骨組みを一括で確認できます。',
  element: (
    <PreviewPage description="ダミー GameState を注入し、各フェーズの UI をシームレスに切り替えて確認できます。" />
  ),
};

const pages: PageInfo[] = [...basePages, ...(import.meta.env.DEV ? [previewPage] : [])];

type NavPage = PageInfo & { disabledReason?: string | null };

const AppNav = () => {
  const { gameState } = useGameState();
  const resumeAvailability = useMemo(() => getResumeAvailability(gameState), [gameState]);

  const navPages: NavPage[] = pages.map((page) => {
    if (page.path !== '/table') return page;
    return {
      ...page,
      disabledReason: resumeAvailability.reason,
    };
  });

  return (
    <Card
      as="nav"
      eyebrow="Routing"
      title="主要ルート"
      description="新規開始から配当までの各ページに移動できます。"
      aria-label="アプリ内ルート一覧"
    >
      <ul className="app__nav-list">
        {navPages.map((page) => (
          <li key={page.path}>
            {page.disabledReason ? (
              <span className="app__nav-link app__nav-link--disabled" aria-disabled="true">
                <span className="app__nav-title">{page.title}</span>
                <span className="app__nav-path">{page.path}</span>
              </span>
            ) : (
              <NavLink
                to={page.path}
                end={page.path === '/'}
                className={({ isActive }) =>
                  `app__nav-link${isActive ? ' app__nav-link--active' : ''}`
                }
              >
                <span className="app__nav-title">{page.title}</span>
                <span className="app__nav-path">{page.path}</span>
              </NavLink>
            )}
            {page.disabledReason && (
              <p className="app__nav-reason">{page.disabledReason}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="app__hint">
        GitHub Pages のように 404 ハンドリングができない環境でも、#/table のようなハッシュ付き URL で安全に遷移できます。
      </p>
    </Card>
  );
};

const GuardedTablePage = ({ element }: { element: ReactNode }) => {
  const { gameState } = useGameState();

  if (!gameState) {
    return <Navigate to="/setup" replace />;
  }

  return <>{element}</>;
};

const AppContent = () => {
  const { pushToast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { hasCorruptedSave } = useGameState();
  usePhaseNavigation();

  useEffect(() => {
    if (!hasCorruptedSave) return;
    pushToast({
      title: '保存データを復元できませんでした',
      description: '破損したデータを破棄しました。Undo や設定ページから復旧を確認してください。',
      variant: 'warning',
      actionLabel: '設定を開く',
      onAction: () => {
        window.location.hash = '#/settings';
      },
    });
  }, [hasCorruptedSave, pushToast]);

  const openDialog = () => setDialogOpen(true);
  const handleDialogConfirm = () => {
    setDialogOpen(false);
    pushToast({
      title: '削除を実行しました',
      description: 'ConfirmDialog で確定アクションを行う例です。',
      variant: 'success',
    });
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    pushToast({
      title: 'キャンセルしました',
      description: '危険操作は ConfirmDialog を経由させましょう。',
      variant: 'info',
    });
  };

  const handleToastShow = () => {
    pushToast({
      title: '一時的なお知らせ',
      description: 'Toast を経由して軽量なフィードバックを出せます。',
      variant: 'warning',
      actionLabel: '元に戻す',
      onAction: () =>
        pushToast({
          title: 'Undo を実行しました',
          description: 'アクション付き Toast の例です。',
          variant: 'success',
        }),
    });
  };

  return (
      <div className="app">
        <header className="app__header">
          <div className="app__logos">
            <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
              <img src={viteLogo} className="app__logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noreferrer">
              <img src={reactLogo} className="app__logo react" alt="React logo" />
            </a>
          </div>
          <h1 className="app__title">Poker Dealer App</h1>
          <p className="app__description">
            GitHub Pages 配信を想定し、URL 直叩きやリロードでも 404 にならないよう HashRouter
            でルーティングしています。 UI は CSS Modules
            を前提に、カード/ボタン/余白の基準を整えました。
          </p>
        </header>

        <main className="app__layout">
          <AppNav />

          <section className="app__content">
            <Card
              eyebrow="UI Foundation"
              title="UI基盤プレビュー"
              description="カード/ボタン/余白の基準をまとめたサンプルです。各ページで再利用できるスタイルを CSS Modules で管理します。"
            >
              <div className="app__ui-grid">
                <div className="app__demo-box">
                  <p className="app__eyebrow">ボタンバリエーション</p>
                  <div className="app__button-row">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="undo">Undo</Button>
                  </div>
                  <div className="app__button-row">
                    <Button variant="primary" disabled>
                      Primary（disabled）
                    </Button>
                    <Button variant="secondary" disabled>
                      Secondary（disabled）
                    </Button>
                    <Button variant="danger" disabled>
                      Danger（disabled）
                    </Button>
                    <Button variant="undo" disabled>
                      Undo（disabled）
                    </Button>
                  </div>
                </div>
                <div className="app__demo-box">
                  <p className="app__eyebrow">カードと余白</p>
                  <p className="app__page-body">
                    ダッシュボード風の余白と装飾を <code>Card</code>{' '}
                    コンポーネントに集約しています。
                  </p>
                  <Button variant="primary" block>
                    主要アクション（block）
                  </Button>
                  <Button variant="secondary" block>
                    セカンダリ導線（block）
                  </Button>
                  <Button variant="undo" block>
                    Undo強調（block）
                  </Button>
                </div>
                <div className="app__demo-box">
                  <p className="app__eyebrow">ダイアログとトースト</p>
                  <p className="app__page-body">
                    危険操作は ConfirmDialog で一呼吸おき、軽微な通知は ToastStack に積む形で
                    再利用できます。
                  </p>
                  <div className="app__button-row">
                    <Button variant="danger" onClick={openDialog}>
                      ConfirmDialog を開く
                    </Button>
                    <Button variant="secondary" onClick={handleToastShow}>
                      Toast を表示
                    </Button>
                  </div>
                </div>
              </div>
              <p className="app__hint">
                Primary/Secondary/Danger/Undo の 4 種に加え、disabled 状態まで揃えておくと、後続
                ページでも統一したトーンで UI を並べられます。
              </p>
            </Card>

            <Routes>
              {pages.map((page) => (
                <Route
                  key={page.path}
                  path={page.path}
                  element={
                    page.path === '/table' ? (
                      <GuardedTablePage element={page.element} />
                    ) : (
                      page.element
                    )
                  }
                />
              ))}
            </Routes>
          </section>
        </main>
        <ConfirmDialog
          open={isDialogOpen}
          title="本当に削除しますか？"
          message="この操作は取り消せません。ログを確認してから決定してください。"
          confirmLabel="削除する"
          cancelLabel="やめておく"
          tone="danger"
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogCancel}
        />
      </div>
  );
};

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
