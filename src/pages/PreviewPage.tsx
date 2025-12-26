import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { clonePreviewState, payoutPreviewState, showdownPreviewState, tablePreviewState } from '../mocks/gameStates';
import { useGameState } from '../state/GameStateContext';
import styles from './PreviewPage.module.css';
import { SetupPage } from './SetupPage';
import { TablePage } from './TablePage';
import { ShowdownPage } from './ShowdownPage';
import { PayoutPage } from './PayoutPage';

interface PreviewPageProps {
  description: string;
}

type PreviewMode = 'empty' | 'table' | 'showdown' | 'payout';

const modeLabels: Record<PreviewMode, string> = {
  empty: '未セットアップ',
  table: 'テーブル',
  showdown: 'ショーダウン',
  payout: '配当',
};

export function PreviewPage({ description }: PreviewPageProps) {
  const { gameState, setGameState, clearGameState } = useGameState();
  const [mode, setMode] = useState<PreviewMode>('table');
  const [originalState] = useState(gameState);

  const applyPreviewState = (nextMode: PreviewMode) => {
    setMode(nextMode);

    if (nextMode === 'empty') {
      clearGameState();
      return;
    }

    const sourceState =
      nextMode === 'table'
        ? tablePreviewState
        : nextMode === 'showdown'
          ? showdownPreviewState
          : payoutPreviewState;

    setGameState(clonePreviewState(sourceState));
  };

  useEffect(() => {
    applyPreviewState(mode);
    return () => {
      if (originalState) {
        setGameState(originalState);
      } else {
        clearGameState();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateNote = useMemo(() => {
    switch (mode) {
      case 'empty':
        return 'GameState をクリアした状態で、各ページの空レイアウトを確認できます。';
      case 'table':
        return 'リバー進行中のダミー GameState をセットし、テーブル UI を即座に確認できます。';
      case 'showdown':
        return 'ショーダウンに進んだ状態をセットし、eligible の切り替えや勝者選択を試せます。';
      case 'payout':
        return '配当計算後の状態をセットし、サマリやスタック反映の表示を確認できます。';
      default:
        return '';
    }
  }, [mode]);

  const previews = useMemo(
    () => [
      {
        key: 'setup',
        title: 'セットアップ',
        description: 'GameState の初期化やプレイヤー入力を行う画面の外観を確認します。',
        element: <SetupPage description="入力枠と開始ボタンのレイアウト確認用" />,
      },
      {
        key: 'table',
        title: 'テーブル',
        description: 'ステータスバー / ポット / 手番パネルが揃ったメインビューを表示します。',
        element: <TablePage description="固定レイアウトとアクションバーの配置確認用" />,
      },
      {
        key: 'showdown',
        title: 'ショーダウン',
        description: 'eligible バッジや勝者チェックボックスのトーンをまとめて確認できます。',
        element: <ShowdownPage description="勝者選択と遷移の確認用" />,
      },
      {
        key: 'payout',
        title: '配当結果',
        description: 'ポット内訳やスタック更新のカード構成を一括でプレビューします。',
        element: <PayoutPage description="サマリと配当内訳の確認用" />,
      },
    ],
    [],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>/preview</p>
        <h2 className={styles.title}>プレビューセンター</h2>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          GameState のダミーをセット/クリアするトグルを用意し、各フェーズの見た目をページ遷移なしで切り替えて確認します。
        </p>
      </header>

      <Card
        eyebrow="State"
        title="ダミー状態を即時切り替え"
        description="ボタン一つで GameState を注入し、テーブル/ショーダウン/配当の各フェーズをシームレスにプレビューします。"
      >
        <div className={styles.toggleRow}>
          {Object.entries(modeLabels).map(([value, label]) => (
            <Button
              key={value}
              variant={mode === value ? 'primary' : 'secondary'}
              onClick={() => applyPreviewState(value as PreviewMode)}
            >
              {label}
            </Button>
          ))}
          <span className={styles.badge}>現在: {modeLabels[mode]}</span>
        </div>
        <p className={styles.stateNote}>{stateNote}</p>
      </Card>

      <div className={styles.previewGrid}>
        {previews.map((preview) => (
          <Card
            key={preview.key}
            eyebrow="Preview"
            title={preview.title}
            description={preview.description}
            className={styles.previewCard}
          >
            <div className={styles.previewFrame}>
              <div className={styles.frameInner}>
                <h3 className={styles.frameTitle}>{preview.title} コンポーネント</h3>
                <p className={styles.frameDescription}>{preview.description}</p>
                <div className={styles.frameBody}>{preview.element}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
