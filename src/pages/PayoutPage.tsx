import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageShortcutBar } from '../components/PageShortcutBar';
import { calcPayoutShares } from '../domain/distribution';
import { useGameState } from '../state/GameStateContext';
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

type PotResult = {
  id: string;
  label: string;
  amount: number;
  note: string;
  eligibleCount: number;
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

export function PayoutPage({ description }: PayoutPageProps) {
  const navigate = useNavigate();
  const { clearGameState } = useGameState();
  const { gameState, payoutResult, proceedToNextHand, currentPhase, previousPhaseAvailability, goToPreviousPhase } =
    useGameMachine();

  useEffect(() => {
    if (gameState && payoutResult) return;

    if (previousPhaseAvailability.canReturn) {
      goToPreviousPhase();
      navigate(previousPhaseAvailability.targetPath);
      return;
    }

    navigate('/table');
  }, [gameState, payoutResult, goToPreviousPhase, navigate, previousPhaseAvailability]);

  if (!gameState || !payoutResult) return null;

  const seatLabel = useMemo(() => {
    return (seatIndex: number) => {
      if (seatIndex === gameState.hand.dealerIndex) return 'BTN';
      if (seatIndex === gameState.hand.sbIndex) return 'SB';
      if (seatIndex === gameState.hand.bbIndex) return 'BB';
      return `Seat ${seatIndex + 1}`;
    };
  }, [gameState]);

  const view = useMemo(() => {
    const players = gameState.players;
    const dealerIndex = payoutResult.dealerIndex;
    const potState = payoutResult.pot;
    const winners = payoutResult.winners;

    const payouts = payoutResult.payouts;

    const breakdown = payoutResult.breakdown;

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

      const eligibleCount =
        pot.id === 'main'
          ? pot.eligiblePlayerIds.length
          : potState.sides[index - 1]?.eligiblePlayerIds.length ?? 0;
      return {
        id: pot.id,
        label: pot.label,
        amount: pot.amount,
        note:
          eligibleCount === 0
            ? 'eligible が存在しません'
            : `${eligibleCount} 名が eligible、${winnersWithShare.length} 名に配当します。`,
        eligibleCount,
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

    const sidePotCount = potResults.filter((pot) => pot.id !== 'main').length;
    const totalWinners = potResults.reduce((acc, pot) => {
      pot.winners.forEach((winner) => acc.add(winner.playerId));
      return acc;
    }, new Set<string>()).size;

    return { potResults, stackUpdates, highlightWinners, totalPayout, sidePotCount, totalWinners };
  }, [gameState, payoutResult, seatLabel]);

  const { potResults, stackUpdates, highlightWinners, totalPayout, sidePotCount, totalWinners } = view;
  const previousPhaseLabel =
    previousPhaseAvailability.targetPath === '/showdown' ? '/showdown に戻ります' : '/table に戻ります';

  const handleDiscardHand = () => {
    clearGameState();
    navigate('/setup');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/payout</p>
          <h2 className={styles.title}>配当結果</h2>
        </div>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          ハンド終了後に確定した配当結果を表示します。ショーダウンで決まった勝者とポット計算の結果のみを利用し、次の
          ハンドへ進むための導線を並べています。
        </p>
      </header>

      <PageShortcutBar
        actions={[
          {
            label: 'ホームへ戻る',
            description: 'ホームに戻ってアプリの導線を確認します。',
            onClick: () => navigate('/'),
            variant: 'secondary',
          },
          {
            label: 'このハンドを破棄',
            description: '配当結果を破棄し、セットアップに戻ります。',
            onClick: handleDiscardHand,
            variant: 'danger',
          },
          {
            label: '前フェーズへ戻る',
            description: previousPhaseAvailability.canReturn
              ? `${previousPhaseLabel}（状態マシンの許可が必要です）`
              : 'ショーダウンに戻れない状態です。',
            onClick: goToPreviousPhase,
            variant: 'undo',
            disabled: !previousPhaseAvailability.canReturn,
            disabledReason: previousPhaseAvailability.reason,
          },
        ]}
      />

      <div className={styles.heroGrid}>
          <Card
            eyebrow="Summary"
            title="配当サマリ"
            description="メイン / サイドポットの合計と、上位勝者の獲得額をまとめています。"
          >
          <div className={styles.summaryGrid}>
            <div className={styles.totalBox}>
              <p className={styles.totalLabel}>総配当</p>
              <p className={styles.totalValue}>{totalPayout.toLocaleString()} pt</p>
              <p className={styles.totalMeta}>メイン + サイドの合計。ショーダウンの結果を反映した配当のみを表示します。</p>
              <div className={styles.totalTags}>
                <span className={styles.badge}>メイン 1 本</span>
                <span className={styles.badge}>{sidePotCount > 0 ? `サイド ${sidePotCount} 本` : 'サイドなし'}</span>
                <span className={styles.badge}>勝者 {totalWinners} 名</span>
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
              description="配当確定後に実行する操作をまとめています。状態マシンに沿ってショーダウンへ戻ることもできます。"
            >
            <div className={styles.actionStack}>
              <div className={styles.inlineInfo}>
                <span className={styles.badge}>スタック反映済み</span>
                <span className={styles.badge}>Undo 導線あり</span>
              </div>
              <p className={styles.actionBody}>
                配当計算を反映した状態で、必要に応じてショーダウンに戻るか、ブラインド徴収とボタン移動を行って次の
                ハンドに進みます。
              </p>
              <div className={styles.buttonRow}>
                <Button
                  variant="secondary"
                  block
                  onClick={() => {
                    if (!previousPhaseAvailability.canReturn) return;
                    goToPreviousPhase();
                    navigate(previousPhaseAvailability.targetPath);
                  }}
                  disabled={!previousPhaseAvailability.canReturn}
                  title={
                    previousPhaseAvailability.canReturn
                      ? previousPhaseLabel
                      : previousPhaseAvailability.reason ?? '前フェーズに戻れません'
                  }
                >
                  前フェーズへ戻る
                </Button>
                <Button
                  variant="primary"
                  block
                  onClick={() => {
                    proceedToNextHand();
                    navigate('/table');
                  }}
                  disabled={currentPhase !== 'PAYOUT'}
                >
                  次へ
                </Button>
              </div>
            {!previousPhaseAvailability.canReturn && previousPhaseAvailability.reason && (
              <p className={styles.hint}>{previousPhaseAvailability.reason}</p>
            )}
            <p className={styles.hint}>配当結果の確認後にステータスバーやプレイヤー表示を更新する導線を置きます。</p>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Breakdown"
        title="ポットごとの配当内訳"
        description="メイン / サイドポットの金額と勝者を、計算済みの結果に基づいて一覧します。"
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
                  <span className={styles.badge}>eligible {pot.eligibleCount} 名</span>
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
        description="配当結果を反映した後の各プレイヤーのスタックとメモを確認できます。"
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
