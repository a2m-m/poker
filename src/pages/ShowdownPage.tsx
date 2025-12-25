import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useGameState } from '../state/GameStateContext';
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

type PotEntry = {
  id: string;
  label: string;
  amount: number;
  note: string;
  eligiblePlayerIds: string[];
  defaultWinners: string[];
};

const demoPlayers: PlayerOption[] = [
  { id: 'p1', name: '佐藤', seat: 'BTN', stack: 18400 },
  { id: 'p2', name: '鈴木', seat: 'SB', stack: 15200 },
  { id: 'p3', name: '高橋', seat: 'BB', stack: 19200 },
  { id: 'p4', name: '田中', seat: 'HJ', stack: 0 },
  { id: 'p5', name: '伊藤', seat: 'CO', stack: 7800 },
];

const demoPotEntries: PotEntry[] = [
  {
    id: 'main',
    label: 'メインポット',
    amount: 8600,
    note: 'リバーまで残った 5 名が対象です。勝者が複数の場合は同点配分します。',
    eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    defaultWinners: ['p3'],
  },
  {
    id: 'side1',
    label: 'サイドポット1',
    amount: 4200,
    note: '伊藤がターンでオールインしたため 4 名で争います。',
    eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'],
    defaultWinners: ['p1', 'p2'],
  },
  {
    id: 'side2',
    label: 'サイドポット2',
    amount: 1800,
    note: '田中のオールインで作成。ブラインド 2 名とボタンの対決です。',
    eligiblePlayerIds: ['p1', 'p2', 'p3'],
    defaultWinners: ['p1'],
  },
];

const boardCards = ['A♠', 'K♦', '7♣', '5♥', '2♠'];

export function ShowdownPage({ description }: ShowdownPageProps) {
  const { gameState } = useGameState();

  const players = useMemo<PlayerOption[]>(() => {
    if (!gameState) return demoPlayers;

    const { players: statePlayers, hand } = gameState;

    const seatLabel = (seatIndex: number) => {
      if (seatIndex === hand.dealerIndex) return 'BTN';
      if (seatIndex === hand.sbIndex) return 'SB';
      if (seatIndex === hand.bbIndex) return 'BB';
      return `Seat ${seatIndex + 1}`;
    };

    return statePlayers
      .slice()
      .sort((a, b) => a.seatIndex - b.seatIndex)
      .map((player) => ({
        id: player.id,
        name: player.name,
        seat: seatLabel(player.seatIndex),
        stack: player.stack,
      }));
  }, [gameState]);

  const potEntries = useMemo<PotEntry[]>(() => {
    if (!gameState) return demoPotEntries;

    const activePlayerIds = gameState.players.filter((player) => player.state !== 'FOLDED').map((p) => p.id);
    const entries: PotEntry[] = [
      {
        id: 'main',
        label: 'メインポット',
        amount: gameState.hand.pot.main,
        note: 'フォールドしていないプレイヤー全員が対象です。',
        eligiblePlayerIds: activePlayerIds,
        defaultWinners: activePlayerIds.slice(0, 1),
      },
      ...gameState.hand.pot.sides.map((side, index) => ({
        id: `side${index + 1}`,
        label: `サイドポット${index + 1}`,
        amount: side.amount,
        note: `eligible ${side.eligiblePlayerIds.length} 名で争われます。`,
        eligiblePlayerIds: side.eligiblePlayerIds,
        defaultWinners: side.eligiblePlayerIds.slice(0, 1),
      })),
    ];

    return entries.filter((entry) => entry.eligiblePlayerIds.length > 0);
  }, [gameState]);

  const [selectedWinners, setSelectedWinners] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(potEntries.map((pot) => [pot.id, pot.defaultWinners])),
  );

  useEffect(() => {
    setSelectedWinners(Object.fromEntries(potEntries.map((pot) => [pot.id, pot.defaultWinners])));
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
          title="配当確定のダミー導線"
          description="選択後に確認 → 配当結果へ進む流れを示すだけのダミー UI です。"
        >
          <div className={styles.actionStack}>
            <div className={styles.inlineInfo}>
              <p className={styles.badge}>同点分配対応</p>
              <p className={styles.badge}>eligible 外はグレー表示</p>
            </div>
            <p className={styles.actionBody}>
              下のポットカードで勝者候補をチェックすると、同点配分や対象外プレイヤーの扱いを確認できます。
              実処理はまだありませんが、ConfirmDialog と Toast でフィードバックする想定です。
            </p>
            <div className={styles.buttonRow}>
              <Button variant="primary" block>
                配当を確定する（デモ）
              </Button>
              <Button variant="secondary" block>
                テーブルへ戻る
              </Button>
              <Button variant="danger" block>
                選択をリセット（未実装）
              </Button>
            </div>
            <p className={styles.hint}>/payout へ進む導線をここに配置予定です。</p>
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
                  <span className={styles.badge}>
                    {pot.defaultWinners.length > 1 ? '同点配分例あり' : '単独勝者例'}
                  </span>
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
