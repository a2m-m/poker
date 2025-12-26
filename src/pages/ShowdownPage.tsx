import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { buildPotBreakdown, buildPotWinnersFromSelection } from '../domain/pot';
import type { Player, PotBreakdown, PotState } from '../domain/types';
import { useGameState } from '../state/GameStateContext';
import { useGameMachine } from '../state/gameMachine';
import styles from './ShowdownPage.module.css';

interface ShowdownPageProps {
  description: string;
}

type PlayerOption = {
  id: string;
  name: string;
  seat: string;
  stack: number;
};

type PotEntry = PotBreakdown & { note: string };

const demoPlayers: Player[] = [
  { id: 'p1', name: '佐藤', seatIndex: 0, stack: 18400, state: 'ACTIVE' },
  { id: 'p2', name: '鈴木', seatIndex: 1, stack: 15200, state: 'ACTIVE' },
  { id: 'p3', name: '高橋', seatIndex: 2, stack: 19200, state: 'ACTIVE' },
  { id: 'p4', name: '田中', seatIndex: 3, stack: 0, state: 'ALL_IN' },
  { id: 'p5', name: '伊藤', seatIndex: 4, stack: 7800, state: 'ACTIVE' },
];

const demoPotState: PotState = {
  main: 8600,
  sides: [
    { amount: 4200, eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'] },
    { amount: 1800, eligiblePlayerIds: ['p1', 'p2', 'p3'] },
  ],
};

const demoSeatLabels: Record<string, string> = {
  p1: 'BTN',
  p2: 'SB',
  p3: 'BB',
  p4: 'HJ',
  p5: 'CO',
};

const boardCards = ['A♠', 'K♦', '7♣', '5♥', '2♠'];

const buildSeatLabel = (handDealer: number, handSb: number, handBb: number) => (seatIndex: number) => {
  if (seatIndex === handDealer) return 'BTN';
  if (seatIndex === handSb) return 'SB';
  if (seatIndex === handBb) return 'BB';
  return `Seat ${seatIndex + 1}`;
};

const attachNotes = (pots: PotBreakdown[]): PotEntry[] =>
  pots.map((pot) => ({
    ...pot,
    note: pot.id === 'main'
      ? `${pot.eligiblePlayerIds.length} 名がショーダウンに参加しています。`
      : `eligible ${pot.eligiblePlayerIds.length} 名で争われます。`,
  }));

export function ShowdownPage({ description }: ShowdownPageProps) {
  const { gameState } = useGameState();
  const { settleShowdown, returnToTablePhase, currentPhase } = useGameMachine();

  const seatLabel = useMemo(() => {
    if (!gameState) return (seatIndex: number) => demoSeatLabels[demoPlayers[seatIndex]?.id] ?? `Seat ${seatIndex + 1}`;
    return buildSeatLabel(gameState.hand.dealerIndex, gameState.hand.sbIndex, gameState.hand.bbIndex);
  }, [gameState]);

  const players = useMemo<PlayerOption[]>(() => {
    const source: Player[] = gameState?.players ?? demoPlayers;

    return source
      .slice()
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((player) => ({
        id: player.id,
        name: player.name,
        seat: seatLabel(player.seatIndex),
        stack: player.stack,
      }));
  }, [gameState, seatLabel]);

  const potEntries = useMemo<PotEntry[]>(() => {
    const sourcePlayers = gameState?.players ?? demoPlayers;
    const { breakdown } = buildPotBreakdown(sourcePlayers, {
      hand: gameState?.hand,
      potStateOverride: gameState ? undefined : demoPotState,
      eligibleMainPlayerIds: gameState ? undefined : demoPlayers.map((p) => p.id),
    });

    return attachNotes(breakdown);
  }, [gameState]);

  const [selectedWinners, setSelectedWinners] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(potEntries.map((pot) => [pot.id, pot.eligiblePlayerIds.slice(0, 1)])),
  );

  useEffect(() => {
    setSelectedWinners(Object.fromEntries(potEntries.map((pot) => [pot.id, pot.eligiblePlayerIds.slice(0, 1)])));
  }, [potEntries]);

  const toggleWinner = (potId: string, playerId: string, eligible: boolean) => {
    if (!eligible) return;

    setSelectedWinners((prev) => {
      const current = prev[potId] ?? [];
      const exists = current.includes(playerId);
      const nextList = exists ? current.filter((id) => id !== playerId) : [...current, playerId];
      return { ...prev, [potId]: nextList };
    });
  };

  const handleConfirm = () => {
    const winners = buildPotWinnersFromSelection(potEntries, selectedWinners);
    if (!gameState) {
      window.location.hash = '#/payout';
      return;
    }
    settleShowdown(winners);
  };

  const resetSelection = () => {
    setSelectedWinners(Object.fromEntries(potEntries.map((pot) => [pot.id, pot.eligiblePlayerIds.slice(0, 1)])));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/showdown</p>
          <h2 className={styles.title}>ショーダウン</h2>
        </div>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          メイン / サイドポットごとに勝者を選ぶ静的なレイアウトです。eligible 外は選択できないスタイルとし、
          同点時の複数選択も視覚化しています。
        </p>
      </header>

      <div className={styles.heroGrid}>
        <Card
          eyebrow="Board"
          title="ボードと流れ"
          description="リバー終了後、各ポットの対象者を確認しながら勝者を選びます。"
        >
          <div className={styles.boardRow}>
            <div className={styles.boardCards} aria-label="ボードのカード">
              {boardCards.map((card) => (
                <span key={card} className={styles.cardChip}>
                  {card}
                </span>
              ))}
            </div>
            <dl className={styles.flowList}>
              <div>
                <dt>1. eligible を確認</dt>
                <dd>サイドポットごとに参加者が変わるため、選択可能な範囲を明示します。</dd>
              </div>
              <div>
                <dt>2. 勝者を選択</dt>
                <dd>複数チェックで同点配分の想定を示します。eligible 外は無効化します。</dd>
              </div>
              <div>
                <dt>3. 配当を確定</dt>
                <dd>ConfirmDialog 経由で確定 → 配当結果画面へ遷移する導線を持たせます。</dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card
          eyebrow="Winners"
          title="配当確定の導線"
          description="選択後に確認 → 配当結果へ進む流れを示します。eligible のみ選択可能です。"
        >
          <div className={styles.actionStack}>
            <div className={styles.inlineInfo}>
              <p className={styles.badge}>同点分配対応</p>
              <p className={styles.badge}>eligible 外はグレー表示</p>
            </div>
            <p className={styles.actionBody}>
              下のポットカードで勝者候補をチェックすると、同点配分や対象外プレイヤーの扱いを確認できます。
              ConfirmDialog での確認を想定しつつ、このデモでは直接 /payout に遷移します。
            </p>
            <div className={styles.buttonRow}>
              <Button
                variant="secondary"
                block
                onClick={() => {
                  if (!gameState) {
                    window.location.hash = '#/table';
                    return;
                  }
                  returnToTablePhase();
                }}
              >
                戻る
              </Button>
              <Button variant="primary" block onClick={handleConfirm} disabled={currentPhase === 'PAYOUT'}>
                次へ
              </Button>
              <Button variant="danger" block onClick={resetSelection}>
                選択をリセット
              </Button>
            </div>
            <p className={styles.hint}>選択内容はポット別に保持され、eligible 外はチェック不可です。</p>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Pot List"
        title="ポットごとの勝者選択"
        description="メイン / サイドポットのカードを横並びにし、eligible に応じてチェック可否を切り替えます。"
      >
        <div className={styles.potGrid}>
          {potEntries.map((pot) => (
            <section key={pot.id} className={styles.potCard} aria-labelledby={`${pot.id}-title`}>
              <div className={styles.potHeader}>
                <div>
                  <p className={styles.potLabel}>{pot.label}</p>
                  <p id={`${pot.id}-title`} className={styles.potAmount}>
                    {pot.amount.toLocaleString()} pt
                  </p>
                </div>
                <div className={styles.potBadges}>
                  <span className={styles.badge}>eligible {pot.eligiblePlayerIds.length} 名</span>
                  <span className={styles.badge}>勝者を複数選択可</span>
                </div>
              </div>
              <p className={styles.potNote}>{pot.note}</p>
              <div className={styles.winnerList} role="group" aria-label={`${pot.label}の勝者候補`}>
                {players.map((player) => {
                  const eligible = pot.eligiblePlayerIds.includes(player.id);
                  const checked = selectedWinners[pot.id]?.includes(player.id) ?? false;

                  return (
                    <label
                      key={`${pot.id}-${player.id}`}
                      className={`${styles.winnerRow}${eligible ? '' : ` ${styles.disabled}`}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!eligible}
                        checked={checked}
                        onChange={() => toggleWinner(pot.id, player.id, eligible)}
                      />
                      <div className={styles.playerInfo}>
                        <span className={styles.playerName}>{player.name}</span>
                        <span className={styles.playerMeta}>
                          {player.seat} / 残りスタック {player.stack.toLocaleString()} pt
                        </span>
                      </div>
                      <span className={styles.eligibility} aria-hidden="true">
                        {eligible ? '選択可' : '対象外'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
