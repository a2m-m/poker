import './App.css';
import { Button } from './components/Button';
import { Card } from './components/Card';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';

const pages = [
  { path: '/', title: 'ホーム', description: 'アプリの概要と導線の起点になります。' },
  { path: '/setup', title: 'セットアップ', description: 'プレイヤーや設定の編集を行うページの予定地です。' },
  { path: '/table', title: 'テーブル', description: '進行中のハンドを表示するメインビューの予定地です。' },
  { path: '/showdown', title: 'ショーダウン', description: '役比較や勝者選択を行う画面の予定地です。' },
  { path: '/payout', title: '配当結果', description: '配当結果を確認するための画面の予定地です。' },
  { path: '/log', title: 'ログ', description: 'アクション履歴を一覧する画面の予定地です。' },
  { path: '/settings', title: '設定', description: '保存/復元や表示設定を扱う画面の予定地です。' },
];

type PageInfo = (typeof pages)[number];

function PagePlaceholder({ title, description, path }: PageInfo) {
  return (
    <Card eyebrow={path} title={title} description={description}>
      <p className="app__hint">
        実装前のプレースホルダーです。HashRouter で直接アクセス/リロードしても 404 になりません。
      </p>
    </Card>
  );
}

function App() {
  return (
    <HashRouter>
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
            GitHub Pages 配信を想定し、URL 直叩きやリロードでも 404 にならないよう HashRouter でルーティングしています。
            UI は CSS Modules を前提に、カード/ボタン/余白の基準を整えました。
          </p>
        </header>

        <main className="app__layout">
          <Card
            as="nav"
            eyebrow="Routing"
            title="主要ルート"
            description="各ページのプレースホルダーに移動できます。"
            aria-label="アプリ内ルート一覧"
          >
            <ul className="app__nav-list">
              {pages.map((page) => (
                <li key={page.path}>
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
                </li>
              ))}
            </ul>
            <p className="app__hint">
              GitHub Pages のように 404 ハンドリングができない環境でも、#/table のようなハッシュ付き URL で安全に遷移できます。
            </p>
          </Card>

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
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="primary" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>
                <div className="app__demo-box">
                  <p className="app__eyebrow">カードと余白</p>
                  <p className="app__page-body">
                    ダッシュボード風の余白と装飾を <code>Card</code> コンポーネントに集約しています。
                  </p>
                  <Button variant="primary" block>
                    主要アクション（block）
                  </Button>
                  <Button variant="ghost" block>
                    セカンダリ導線（block）
                  </Button>
                </div>
              </div>
              <p className="app__hint">
                ボタンの塗り/線/ゴーストと余白が揃っていれば、後続ページでも統一したトーンで UI を並べられます。
              </p>
            </Card>

            <Routes>
              {pages.map((page) => (
                <Route key={page.path} path={page.path} element={<PagePlaceholder {...page} />} />
              ))}
            </Routes>
          </section>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
