import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ActionLogEntry, ActionType, Street } from '../domain/types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageShortcutBar } from '../components/PageShortcutBar';
import { useGameState } from '../state/GameStateContext';
import styles from './LogPage.module.css';

interface LogPageProps {
  description: string;
  entries?: LogEntry[];
}

type LogEntry = {
  id: string;
  order: number;
  street: string;
  actor: string;
  position: string;
  action: string;
  amount?: number;
  toAmount?: number;
  note?: string;
  timestamp?: string;
};

const streetLabels: Record<Street, string> = {
  PREFLOP: 'プリフロップ',
  FLOP: 'フロップ',
  TURN: 'ターン',
  RIVER: 'リバー',
  SHOWDOWN: 'ショーダウン',
  PAYOUT: '配当',
};

const actionLabels: Record<ActionType, string> = {
  CHECK: 'チェック',
  BET: 'ベット',
  CALL: 'コール',
  RAISE: 'レイズ',
  FOLD: 'フォールド',
  ALL_IN: 'オールイン',
  ADVANCE_STREET: 'ストリート終了',
  START_HAND: 'ハンド開始',
  END_HAND: 'ハンド終了',
};

const getRoleForIndex = (hand: { dealerIndex: number; sbIndex: number; bbIndex: number }, seatIndex: number) => {
  if (seatIndex === hand.dealerIndex) return 'D';
  if (seatIndex === hand.sbIndex) return 'SB';
  if (seatIndex === hand.bbIndex) return 'BB';
  return '参加者';
};

const sampleEntries: LogEntry[] = [
  {
    id: 'h12-1',
    order: 1,
    street: 'プリフロップ',
    actor: '佐藤',
    position: 'BTN',
    action: 'フォールド',
    note: 'UTG にレイズが入ったため撤退。',
    timestamp: '00:11',
  },
  {
    id: 'h12-2',
    order: 2,
    street: 'プリフロップ',
    actor: '鈴木',
    position: 'SB',
    action: 'コール',
    amount: 400,
    note: 'SB 200 支払い済。差額 200 をコール。',
    timestamp: '00:12',
  },
  {
    id: 'h12-3',
    order: 3,
    street: 'プリフロップ',
    actor: '高橋',
    position: 'BB',
    action: 'レイズ',
    amount: 1_200,
    toAmount: 1_400,
    note: '最小レイズ 1,200 で 1,400 へ。',
    timestamp: '00:13',
  },
  {
    id: 'h12-4',
    order: 4,
    street: 'プリフロップ',
    actor: '田中',
    position: 'UTG',
    action: 'コール',
    amount: 1_200,
    note: 'ショートのためフロップ勝負を選択。',
    timestamp: '00:14',
  },
  {
    id: 'h12-5',
    order: 5,
    street: 'フロップ',
    actor: '鈴木',
    position: 'SB',
    action: 'チェック',
    timestamp: '00:16',
  },
  {
    id: 'h12-6',
    order: 6,
    street: 'フロップ',
    actor: '高橋',
    position: 'BB',
    action: 'ベット',
    amount: 2_000,
    note: 'ポット 4,600 に対して半額ベット。',
    timestamp: '00:17',
  },
  {
    id: 'h12-7',
    order: 7,
    street: 'フロップ',
    actor: '田中',
    position: 'UTG',
    action: 'オールイン',
    amount: 5_600,
    note: '残りスタックをすべて投入。',
    timestamp: '00:18',
  },
  {
    id: 'h12-8',
    order: 8,
    street: 'フロップ',
    actor: '鈴木',
    position: 'SB',
    action: 'フォールド',
    note: 'サイドポットが発生。',
    timestamp: '00:19',
  },
  {
    id: 'h12-9',
    order: 9,
    street: 'フロップ',
    actor: '高橋',
    position: 'BB',
    action: 'コール',
    amount: 3_600,
    note: '全額コールでターンへ。',
    timestamp: '00:20',
  },
];

const formatAction = (entry: LogEntry) => {
  const base = entry.amount ? `${entry.action} ${entry.amount.toLocaleString()}` : entry.action;
  if (!entry.toAmount) return base;
  return `${base}（合計 ${entry.toAmount.toLocaleString()}）`;
};

const toDisplayEntries = (
  actionLog: ActionLogEntry[],
  options: {
    players: { id: string; name: string; seatIndex: number }[];
    hand: { dealerIndex: number; sbIndex: number; bbIndex: number };
  },
): LogEntry[] => {
  const { players, hand } = options;
  return actionLog.map((entry) => {
    const player = players.find((p) => p.id === entry.playerId);
    const position = player ? getRoleForIndex(hand, player.seatIndex) : '参加者';
    return {
      id: `log-${entry.seq}`,
      order: entry.seq,
      street: streetLabels[entry.street],
      actor: player?.name ?? '不明なプレイヤー',
      position,
      action: actionLabels[entry.type] ?? entry.type,
      amount: entry.amount,
      note: entry.snapshot ? 'スナップショット保存あり' : undefined,
    };
  });
};

export function LogPage({ description, entries }: LogPageProps) {
  const navigate = useNavigate();
  const { gameState, clearGameState } = useGameState();

  const logs = useMemo(() => {
    if (entries) return entries;
    if (gameState) {
      return toDisplayEntries(gameState.hand.actionLog, { players: gameState.players, hand: gameState.hand });
    }
    return sampleEntries;
  }, [entries, gameState]);

  const { streets, totalActions } = useMemo(() => {
    const uniqueStreets = Array.from(new Set(logs.map((log) => log.street)));
    return {
      streets: uniqueStreets,
      totalActions: logs.length,
    };
  }, [logs]);

  const handleDiscardHand = () => {
    clearGameState();
    navigate('/setup');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/log</p>
          <h2 className={styles.title}>ログ</h2>
        </div>
        <div className={styles.headerBody}>
          <p className={styles.lead}>{description}</p>
          <p className={styles.note}>
            このページでは、1 ハンド分のアクション履歴を時系列で確認できます。編集はできませんが、Undo や設定画面の導線を
            まとめて、手番確認へすぐ戻れるようにしています。
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/table')}>
            テーブルに戻る
          </Button>
          <NavLink to="/settings" className={styles.settingsLink}>
            設定を開く
          </NavLink>
        </div>
      </header>

      <PageShortcutBar
        actions={[
          {
            label: 'ホームへ戻る',
            description: 'ホームに戻って導線を再確認します。',
            onClick: () => navigate('/'),
            variant: 'secondary',
          },
          {
            label: '手番確認に戻る',
            description: '/table へ移動し、現在のハンドを確認します。',
            onClick: () => navigate('/table'),
            variant: 'undo',
          },
          {
            label: 'このハンドを破棄',
            description: '履歴を破棄して /setup からやり直します。',
            onClick: handleDiscardHand,
            variant: 'danger',
          },
        ]}
      />

      <div className={styles.grid}>
        <Card
          eyebrow="Summary"
          title="このハンドの概要"
          description="ストリートとアクション件数をまとめたサマリーです。ログ配列から自動集計します。"
        >
          <dl className={styles.metaList}>
            <div>
              <dt>対象ハンド</dt>
              <dd>#12（デモ）</dd>
            </div>
            <div>
              <dt>ストリート</dt>
              <dd>{streets.join(' / ')}</dd>
            </div>
            <div>
              <dt>アクション数</dt>
              <dd>{totalActions} 件</dd>
            </div>
            <div>
              <dt>最後の更新</dt>
              <dd>{logs.at(-1)?.timestamp ?? '—'}</dd>
            </div>
          </dl>
          <p className={styles.inlineHelp}>
            配列を差し替えるだけで件数やストリート一覧が変わる構造にしており、バックエンドのログ保持機能に接続しやすく
            しています。
          </p>
        </Card>

        <Card
          eyebrow="Action Log"
          title="アクション時系列"
          description="手番順に並べた履歴の器です。ストリートごとにまとまりを付け、必要に応じてフィルタ枠を追加できます。"
        >
          <div className={styles.logList} aria-label="アクションログ一覧">
            {logs.map((entry) => (
              <article key={entry.id} className={styles.logItem}>
                <div className={styles.logHeader}>
                  <span className={styles.street}>{entry.street}</span>
                  <span className={styles.timestamp}>#{entry.order.toString().padStart(2, '0')}</span>
                </div>
                <div className={styles.contentRow}>
                  <div>
                    <p className={styles.actor}>
                      {entry.actor}
                      <span className={styles.position}>（{entry.position}）</span>
                    </p>
                    <p className={styles.actionText}>{formatAction(entry)}</p>
                  </div>
                  {entry.timestamp && <span className={styles.time}>{entry.timestamp}</span>}
                </div>
                {entry.note && <p className={styles.logNote}>{entry.note}</p>}
              </article>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.footerActions}>
        <Button variant="secondary" onClick={() => navigate('/table')}>
          手番確認へ戻る
        </Button>
        <NavLink to="/table" className={styles.textLink}>
          /table へ戻るショートカット
        </NavLink>
        <NavLink to="/setup" className={styles.textLink}>
          セットアップに戻る
        </NavLink>
      </div>
    </div>
  );
}
