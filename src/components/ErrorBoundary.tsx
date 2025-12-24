import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('アプリで予期しないエラーが発生しました', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <main className="app__layout">
            <Card
              eyebrow="例外が発生しました"
              title="画面をリロードして復旧してください"
              description="保存済みの状態は維持されます。ログやUndoの導線も用意しています。"
            >
              <div className={styles.fallback}>
                <p className={styles.body}>
                  想定外の状態になりました。リロードしても解消しない場合は、直近のログを確認するか Undo をお試しください。
                </p>
                <div className={styles.actions}>
                  <Button variant="primary" onClick={this.handleReload}>
                    画面をリロードする
                  </Button>
                  <a className={styles.secondary} href="#/log">
                    直近ログを見る
                  </a>
                  <a className={styles.secondary} href="#/table">
                    Undo/復旧へ戻る
                  </a>
                </div>
                <p className={styles.hint}>
                  状態を破棄してやり直す場合は、設定ページからリセットしてください。
                </p>
              </div>
            </Card>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
