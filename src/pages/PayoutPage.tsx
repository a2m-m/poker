import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { calcPayoutShares, distribute } from '../domain/distribution';
import { buildPotBreakdown } from '../domain/pot';
import type { Player, PotState, PotWinners } from '../domain/types';
import { useGameMachine } from '../state/gameMachine';
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

type PotEntry = {
  id: string;
  label: string;
  amount: number;
  note: string;
  winnerIds: string[];
  eligiblePlayerIds: string[];
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
const demoPlayers: Player[] = [
  { id: 'p1', name: '佐藤', seatIndex: 0, stack: 22300, state: 'ACTIVE' },
  { id: 'p2', name: '鈴木', seatIndex: 1, stack: 17300, state: 'ACTIVE' },
  { id: 'p3', name: '高橋', seatIndex: 2, stack: 27800, state: 'ACTIVE' },
  { id: 'p4', name: '田中', seatIndex: 3, stack: 1800, state: 'ALL_IN' },
  { id: 'p5', name: '伊藤', seatIndex: 4, stack: 7800, state: 'ACTIVE' },
];

const demoBreakdown: PotEntry[] = [
  {
    id: 'main',
    label: 'メインポット',
    amount: 8600,
    note: 'リバーまで残った 5 名が対象。BB のトップペアがそのまま勝利しました。',
    winnerIds: ['p3'],
    eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
  {
    id: 'side1',
    label: 'サイドポット1',
    amount: 4200,
    note: 'ターンでのオールインにより 4 名が eligible。BTN / SB が同点で分配。',
    winnerIds: ['p1', 'p2'],
    eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'],
  },
  {
    id: 'side2',
    label: 'サイドポット2',
    amount: 1800,
    note: '田中のショートスタックが作ったサイド。BTN が単独で回収。',
    winnerIds: ['p1'],
    eligiblePlayerIds: ['p1', 'p2', 'p3'],
  },
];

export function PayoutPage({ description }: PayoutPageProps) {
  const navigate = useNavigate();
  const { gameState, payoutResult, proceedToNextHand, goToShowdown } = useGameMachine();

  const seatLabel = useMemo(() => {
    const fallbackLabels = ['BTN', 'SB', 'BB', 'HJ', 'CO', 'UTG'];
    if (!gameState) return (seatIndex: number) => fallbackLabels[seatIndex] ?? `Seat ${seatIndex + 1}`;
    return (seatIndex: number) => {
      if (seatIndex === gameState.hand.dealerIndex) return 'BTN';
      if (seatIndex === gameState.hand.sbIndex) return 'SB';
      if (seatIndex === gameState.hand.bbIndex) return 'BB';
      return `Seat ${seatIndex + 1}`;
    };
  }, [gameState]);

  const view = useMemo(() => {
    const players = gameState?.players ?? demoPlayers;

    const dealerIndex = payoutResult?.dealerIndex ?? gameState?.hand.dealerIndex ?? 0;
    const potState: PotState = payoutResult?.pot ?? {
      main: demoBreakdown[0]?.amount ?? 0,
      sides: demoBreakdown.slice(1).map((pot) => ({ amount: pot.amount, eligiblePlayerIds: pot.eligiblePlayerIds })),
    };
    const winners: PotWinners = payoutResult?.winners ?? {
      main: demoBreakdown[0]?.winnerIds ?? [],
      sides: demoBreakdown.slice(1).map((pot) => pot.winnerIds),
    };

    const payouts = payoutResult?.payouts ?? distribute(players, dealerIndex, potState, winners);

    const breakdown = payoutResult?.breakdown ?? buildPotBreakdown(players, {
      potStateOverride: potState,
      eligibleMainPlayerIds: players.map((p) => p.id),
    }).breakdown;

    const potResults: PotResult[] = breakdown.map((pot, index) => {
      const winnerIds = pot.id === 'main' ? winners.main : winners.sides[index - 1] ?? [];
      const shares = calcPayoutShares(players, dealerIndex, pot.amount, winnerIds);

      const winnersWithShare: WinnerShare[] = winnerIds.map((playerId) => {
        const player = players.find((p) => p.id === playerId);
        const share = shares[playerId] ?? 0;
        const updatedStack = player?.stack ?? 0;

        return {
          playerId,
          name: player?.name ?? '不明なプレイヤー',
          seat: player ? seatLabel(player.seatIndex) : '-',
          share,
          updatedStack,
        };
      });

      const fallbackNote = payoutResult ? null : demoBreakdown.find((demo) => demo.id === pot.id)?.note;
      return {
        id: pot.id,
        label: pot.label,
        amount: pot.amount,
        note:
          fallbackNote ??
          ((potState.sides[index - 1]?.eligiblePlayerIds.length ?? pot.eligiblePlayerIds.length) === 0
            ? 'eligible が存在しません'
            : pot.id === 'main'
              ? `${pot.eligiblePlayerIds.length} 名が対象です。`
              : `${pot.eligiblePlayerIds.length} 名が eligible です。`),
        winners: winnersWithShare,
      };
    });

    const stackUpdates: StackUpdate[] = players.map((player) => {
      const delta = payouts[player.id] ?? 0;
      const stackAfter = player.stack;
      const stackBefore = stackAfter - delta;
      return {
        id: player.id,
        name: player.name,
        seat: seatLabel(player.seatIndex),
        stackBefore,
        delta,
        stackAfter,
        memo: delta > 0 ? '配当を反映しました。' : '今回の配当はありません。',
      };
    });

    const highlightWinners: WinnerShare[] = stackUpdates
      .filter((player) => player.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        seat: player.seat,
        share: player.delta,
        updatedStack: player.stackAfter,
      }));

    const totalPayout = breakdown.reduce((sum, pot) => sum + pot.amount, 0);

    return { potResults, stackUpdates, highlightWinners, totalPayout };
  }, [gameState, payoutResult, seatLabel]);

  const { potResults, stackUpdates, highlightWinners, totalPayout } = view;

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
          description="配当確定後に実行する操作をまとめています。"
        >
          <div className={styles.actionStack}>
            <div className={styles.inlineInfo}>
              <span className={styles.badge}>スタック反映済み</span>
              <span className={styles.badge}>Undo 導線あり</span>
            </div>
            <p className={styles.actionBody}>
              配当計算を反映した後、ブラインド徴収とボタン移動を行い /table に戻ります。ショーダウンに戻る導線も
              用意しています。
            </p>
            <div className={styles.buttonRow}>
              <Button variant="primary" block onClick={proceedToNextHand}>
                次のハンドへ進む
              </Button>
              <Button variant="secondary" block onClick={() => navigate('/table')}>
                テーブルへ戻る
              </Button>
              <Button variant="undo" block onClick={goToShowdown}>
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
