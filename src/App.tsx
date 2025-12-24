import './App.css';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {
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
          Vite + React + TypeScript で構築したポーカーディーラー支援アプリの雛形です。
        </p>
      </header>
      <main className="app__main">
        <section className="app__card">
          <h2>はじめの一歩</h2>
          <ol>
            <li><code>npm install</code> で依存関係をセットアップ</li>
            <li><code>npm run dev</code> でローカルサーバーを起動</li>
            <li>ブラウザで <code>http://localhost:5173</code> を開いて動作確認</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default App;
