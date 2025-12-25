import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { GameStateProvider } from './state/GameStateContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <GameStateProvider>
          <App />
        </GameStateProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
