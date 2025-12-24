import { Button } from '../components/Button';
import { Card } from '../components/Card';
import styles from './PayoutPage.module.css';

interface PayoutPageProps {
  description: string;
}

type WinnerShare = {
  playerId: string;
  name: string;
  seat: string;
  share: number;
  updatedStack: number;
};

type PotResult = {
  id: string;
  label: string;
  amount: number;
  note: string;
  winners: WinnerShare[];
};

type StackUpdate = {
  id: string;
  name: string;
  seat: string;
  stackBefore: number;
  delta: number;
  stackAfter: number;
  memo: string;
};

const potResults: PotResult[] = [
  {
    id: 'main',
    label: 'メインポット',
    amount: 8600,
    note: 'リバーまで残った 5 名が対象。BB のトップペアがそのまま勝利しました。',
    winners: [
      { playerId: 'p3', name: '高橋', seat: 'BB', share: 8600, updatedStack: 27800 },
    ],
  },
  {
    id: 'side1',
    label: 'サイドポット1',
    amount: 4200,
    note: 'ターンでのオールインにより 4 名が eligible。BTN / SB が同点で分配。',
    winners: [
      { playerId: 'p1', name: '佐藤', seat: 'BTN', share: 2100, updatedStack: 20500 },
      { playerId: 'p2', name: '鈴木', seat: 'SB', share: 2100, updatedStack: 17300 },
    ],
  },
  {
    id: 'side2',
    label: 'サイドポット2',
    amount: 1800,
    note: '田中のショートスタックが作ったサイド。BTN が単独で回収。',
    winners: [
      { playerId: 'p1', name: '佐藤', seat: 'BTN', share: 1800, updatedStack: 22300 },
    ],
  },
];

const stackUpdates: StackUpdate[] = [
  {
    id: 'p1',
    name: '佐藤',
    seat: 'BTN',
    stackBefore: 18400,
    delta: 3900,
    stackAfter: 22300,
    memo: 'サイドポット 2 つを獲得し、ショートを一気に脱出。',
  },
  {
    id: 'p2',
    name: '鈴木',
    seat: 'SB',
    stackBefore: 15200,
    delta: 2100,
    stackAfter: 17300,
    memo: '同点配分でスタックを維持。次ハンドは SB で再開します。',
  },
  {
    id: 'p3',
    name: '高橋',
    seat: 'BB',
    stackBefore: 19200,
    delta: 8600,
    stackAfter: 27800,
    memo: 'メインポットを総取りしてチップリーダーに。',
  },
  {
    id: 'p4',
    name: '田中',
    seat: 'HJ',
    stackBefore: 1800,
    delta: -1800,
    stackAfter: 0,
    memo: 'オールインが届かず、ショートスタックのままバスト。次ゲームから除外されます。',
  },
  {
    id: 'p5',
    name: '伊藤',
    seat: 'CO',
    stackBefore: 7800,
    delta: -3600,
    stackAfter: 4200,
    memo: 'リバーでドローミス。次ストリートは 4.2K で再スタート。',
  },
];

const highlightWinners: WinnerShare[] = [
  { playerId: 'p3', name: '高橋', seat: 'BB', share: 8600, updatedStack: 27800 },
  { playerId: 'p1', name: '佐藤', seat: 'BTN', share: 3900, updatedStack: 22300 },
  { playerId: 'p2', name: '鈴木', seat: 'SB', share: 2100, updatedStack: 17300 },
];

export function PayoutPage({ description }: PayoutPageProps) {
  const totalPayout = potResults.reduce((sum, pot) => sum + pot.amount, 0);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/payout</p>
          <h2 className={styles.title}>配当結果</h2>
        </div>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          ハンド終了後にポットを再計算し、勝者ごとの獲得額とスタック更新を確認する静的レイアウトです。メイン / サイド
          ポットの内訳と、次のハンドへ進むための導線を並べています。
        </p>
      </header>

      <div className={styles.heroGrid}>
        <Card
          eyebrow="Summary"
          title="配当サマリ"
          description="メイン / サイドポットの合計と、主要勝者の獲得額をまとめています。"
        >
          <div className={styles.summaryGrid}>
            <div className={styles.totalBox}>
              <p className={styles.totalLabel}>総配当</p>
              <p className={styles.totalValue}>{totalPayout.toLocaleString()} pt</p>
              <p className={styles.totalMeta}>メイン + サイドの合計。配当計算の結果をこの領域に集約します。</p>
              <div className={styles.totalTags}>
                <span className={styles.badge}>メイン 1 本</span>
                <span className={styles.badge}>サイド 2 本</span>
                <span className={styles.badge}>同点配分あり</span>
              </div>
            </div>
            <div className={styles.highlightList} aria-label="主な勝者">
              {highlightWinners.map((winner) => (
                <div key={winner.playerId} className={styles.highlightCard}>
                  <div className={styles.highlightHeader}>
                    <p className={styles.highlightName}>{winner.name}</p>
                    <span className={styles.highlightSeat}>{winner.seat}</span>
                  </div>
                  <p className={styles.highlightShare}>+{winner.share.toLocaleString()} pt</p>
                  <p className={styles.highlightStack}>新スタック {winner.updatedStack.toLocaleString()} pt</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          eyebrow="Next Step"
          title="次のハンドへの導線"
          description="配当確定後に実行する操作を並べたダミーのアクションカードです。"
        >
          <div className={styles.actionStack}>
            <div className={styles.inlineInfo}>
              <span className={styles.badge}>スタック反映済み</span>
              <span className={styles.badge}>Undo 導線あり</span>
            </div>
            <p className={styles.actionBody}>
              ConfirmDialog で確定 → Toast でフィードバック → テーブルへ戻る、という一連の流れをここに配線する想定です。
              このデモではスタイルのみを固定しています。
            </p>
            <div className={styles.buttonRow}>
              <Button variant="primary" block>
                次のハンドへ進む（ダミー）
              </Button>
              <Button variant="secondary" block>
                テーブルへ戻る
              </Button>
              <Button variant="undo" block>
                ショーダウンに戻る
              </Button>
            </div>
            <p className={styles.hint}>配当結果の確認後にステータスバーやプレイヤー表示を更新する導線を置きます。</p>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Breakdown"
        title="ポットごとの配当内訳"
        description="メイン / サイドポットの金額と勝者を一覧する静的なレイアウトです。"
      >
        <div className={styles.potGrid}>
          {potResults.map((pot) => (
            <section key={pot.id} className={styles.potCard} aria-labelledby={`${pot.id}-title`}>
              <div className={styles.potHeader}>
                <div>
                  <p className={styles.potLabel}>{pot.label}</p>
                  <p id={`${pot.id}-title`} className={styles.potAmount}>
                    {pot.amount.toLocaleString()} pt
                  </p>
                </div>
                <div className={styles.potBadges}>
                  <span className={styles.badge}>勝者 {pot.winners.length} 名</span>
                  <span className={styles.badge}>再計算済み</span>
                </div>
              </div>
              <p className={styles.potNote}>{pot.note}</p>
              <div className={styles.winnerList} role="group" aria-label={`${pot.label}の勝者`}>
                {pot.winners.map((winner) => (
                  <div key={`${pot.id}-${winner.playerId}`} className={styles.winnerRow}>
                    <div className={styles.winnerInfo}>
                      <p className={styles.winnerName}>{winner.name}</p>
                      <p className={styles.winnerSeat}>{winner.seat}</p>
                    </div>
                    <p className={styles.winnerShare}>+{winner.share.toLocaleString()} pt</p>
                    <p className={styles.winnerStack}>スタック {winner.updatedStack.toLocaleString()} pt</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card
        eyebrow="Stacks"
        title="スタック更新の確認"
        description="配当結果を反映した後の各プレイヤーのスタックとメモをまとめています。"
      >
        <div className={styles.stackList}>
          {stackUpdates.map((player) => (
            <div key={player.id} className={styles.stackRow}>
              <div>
                <p className={styles.stackName}>
                  {player.name} <span className={styles.stackSeat}>{player.seat}</span>
                </p>
                <p className={styles.stackMemo}>{player.memo}</p>
              </div>
              <div className={styles.stackNumbers}>
                <span className={styles.stackBefore}>{player.stackBefore.toLocaleString()} pt</span>
                <span
                  className={`${styles.stackDelta} ${player.delta >= 0 ? styles.positive : styles.negative}`}
                  aria-label={player.delta >= 0 ? '増加' : '減少'}
                >
                  {player.delta >= 0 ? '+' : ''}
                  {player.delta.toLocaleString()} pt
                </span>
                <span className={styles.stackAfter}>{player.stackAfter.toLocaleString()} pt</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
