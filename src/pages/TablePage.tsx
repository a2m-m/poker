import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ActionModal } from '../components/ActionModal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PotPanel } from '../components/PotPanel';
import { PlayerCard, type PlayerRole, type PlayerStatus } from '../components/PlayerCard';
import { StatusBar } from '../components/StatusBar';
import { TurnPanel } from '../components/TurnPanel';
import { calcCallNeeded, calcMinRaiseTo } from '../domain/bets';
import { ActionLogEntry, ActionType, HandState, PlayerState, Street } from '../domain/types';
import { useGameState } from '../state/GameStateContext';
import styles from './TablePage.module.css';

interface TablePageProps {
  description: string;
}

const streetLabels: Record<Street, string> = {
  PREFLOP: 'プリフロップ',
  FLOP: 'フロップ',
  TURN: 'ターン',
  RIVER: 'リバー',
  SHOWDOWN: 'ショーダウン',
  PAYOUT: '配当',
};

const statusText: Record<PlayerState, PlayerStatus> = {
  ACTIVE: '参加中',
  FOLDED: 'フォールド',
  ALL_IN: 'オールイン',
};

const getRoleForIndex = (hand: { dealerIndex: number; sbIndex: number; bbIndex: number }, seatIndex: number): PlayerRole | undefined => {
  if (seatIndex === hand.dealerIndex) return 'D';
  if (seatIndex === hand.sbIndex) return 'SB';
  if (seatIndex === hand.bbIndex) return 'BB';
  return undefined;
};

const cloneHandState = (hand: HandState): HandState => JSON.parse(JSON.stringify(hand)) as HandState;

export function TablePage({ description }: TablePageProps) {
  const { gameState, updateGameState } = useGameState();
  const [actionModalOpen, setActionModalOpen] = useState(false);

  if (!gameState) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>/table</p>
            <h2 className={styles.title}>テーブル</h2>
          </div>
          <p className={styles.lead}>{description}</p>
          <p className={styles.note}>ホームから「新規ゲームを開始」→セットアップで開始すると現在のプレイヤーとブラインドがここに表示されます。</p>
        </header>

        <Card
          eyebrow="Game State"
          title="ゲーム状態が見つかりません"
          description="セットアップページで人数とブラインドを入力し、開始してください。"
        >
          <p className={styles.sectionDescription}>状態を共有するため、まず /setup で新規開始を押してください。</p>
          <NavLink to="/setup" className={styles.textLink}>
            セットアップへ移動
          </NavLink>
        </Card>
      </div>
    );
  }

  const { players, hand } = gameState;
  const turnPlayer = players.find((player) => player.id === hand.currentTurnPlayerId);
  const turnRole = turnPlayer ? getRoleForIndex(hand, turnPlayer.seatIndex) : undefined;
  const callNeeded = turnPlayer ? calcCallNeeded(hand, turnPlayer.id) : 0;
  const minRaiseTo = calcMinRaiseTo(hand);
  const canRaise = minRaiseTo !== null;
  const minRaiseText = minRaiseTo?.toLocaleString() ?? '—';
  const potTotal = hand.pot.main + hand.pot.sides.reduce((sum, side) => sum + side.amount, 0);
  const buttonPlayer = players.find((player) => player.seatIndex === hand.dealerIndex)?.name ?? '—';
  const smallBlindPlayer = players.find((player) => player.seatIndex === hand.sbIndex)?.name ?? '—';
  const bigBlindPlayer = players.find((player) => player.seatIndex === hand.bbIndex)?.name ?? '—';
  const raiseDisabledReason = hand.currentBet === 0 ? '現在ベットがあるときのみ' : '最小レイズ未満のオールインにより再オープンしていません';

  const appendDemoLog = () => {
    updateGameState((prev) => {
      if (!prev) return prev;

      const turn = prev.players.find((player) => player.id === prev.hand.currentTurnPlayerId) ?? prev.players[0];
      if (!turn) return prev;

      const nextSeq = (prev.hand.actionLog.at(-1)?.seq ?? 0) + 1;
      const actionCycle: ActionType[] = ['CHECK', 'CALL', 'BET', 'RAISE', 'FOLD', 'ALL_IN'];
      const type = actionCycle[nextSeq % actionCycle.length];
      const baseAmount = Math.max(0, prev.hand.currentBet);
      const amount = ['CHECK', 'FOLD'].includes(type)
        ? undefined
        : Math.max(calcCallNeeded(prev.hand, turn.id), baseAmount + nextSeq * 50);

      const entry: ActionLogEntry = {
        seq: nextSeq,
        type,
        playerId: turn.id,
        amount,
        street: prev.hand.street,
        snapshot: cloneHandState(prev.hand),
      };

      const contribThisStreet = { ...prev.hand.contribThisStreet };
      if (amount) {
        contribThisStreet[turn.id] = (contribThisStreet[turn.id] ?? 0) + amount;
      }

      const pot = {
        ...prev.hand.pot,
        main: prev.hand.pot.main + (amount ?? 0),
      };

      const currentBet = amount ? Math.max(prev.hand.currentBet, contribThisStreet[turn.id] ?? 0) : prev.hand.currentBet;
      const lastRaiseSize = type === 'RAISE' && amount ? Math.max(0, amount - prev.hand.currentBet) : prev.hand.lastRaiseSize;

      const currentIndex = prev.players.findIndex((player) => player.id === turn.id);
      const nextPlayer = prev.players[(currentIndex + 1) % prev.players.length];

      return {
        ...prev,
        hand: {
          ...prev.hand,
          currentTurnPlayerId: nextPlayer?.id ?? prev.hand.currentTurnPlayerId,
          currentBet,
          lastRaiseSize,
          contribThisStreet,
          pot,
          actionLog: [...prev.hand.actionLog, entry],
        },
      };
    });
  };

  const handleUndo = () => {
    updateGameState((prev) => {
      if (!prev) return prev;
      if (prev.hand.actionLog.length === 0) return prev;

      const lastEntry = prev.hand.actionLog.at(-1);
      const trimmedLog = prev.hand.actionLog.slice(0, -1);

      const restoredActionLog = lastEntry?.snapshot?.actionLog ?? trimmedLog;

      if (!lastEntry?.snapshot) {
        return {
          ...prev,
          hand: {
            ...prev.hand,
            actionLog: trimmedLog,
          },
        };
      }

      return {
        ...prev,
        hand: {
          ...lastEntry.snapshot,
          actionLog: restoredActionLog,
        },
      };
    });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>/table</p>
          <h2 className={styles.title}>テーブル</h2>
        </div>
        <p className={styles.lead}>{description}</p>
        <p className={styles.note}>
          状態バー / ポット表示 / プレイヤーリスト / 手番エリアを配置したレイアウトデモです。セットアップで入力した値を
          そのまま反映し、手番や必要額が更新される様子を確認できます。
        </p>
      </header>

      <Card
        eyebrow="Status Bar"
        title="ステータスバー"
        description="ハンド進行中に常時表示するステータスの配置サンプルです。"
      >
        <StatusBar
          handNumber={hand.handNumber}
          street={streetLabels[hand.street]}
          goal="全員の投入額を揃えます"
          currentBet={hand.currentBet}
          callNeeded={callNeeded}
          minRaise={minRaiseTo}
          buttonPlayer={buttonPlayer}
          smallBlindPlayer={smallBlindPlayer}
          bigBlindPlayer={bigBlindPlayer}
        />
      </Card>

      <div className={styles.topGrid}>
      <Card
        eyebrow="Pot"
        title="ポット表示"
        description="合計と内訳をまとめた中央エリアの想定です。折りたたみ可能なリストを置く余白を確保しています。"
      >
          <PotPanel pot={hand.pot} players={players} />
      </Card>

        <Card
          eyebrow="Turn"
          title="手番エリア"
          description="「手番 / 必要 / 可能」を3行で固定表示する領域です。ボタンとは分けて目視しやすくしています。"
        >
          <TurnPanel
            turnPlayer={turnPlayer?.name ?? '—'}
            positionLabel={turnRole ?? '参加者'}
            requiredText={`コール ${callNeeded.toLocaleString()}（継続）`}
            availableText={`チェック / レイズは ${minRaiseText} 以上 / オールイン ${(turnPlayer?.stack ?? 0).toLocaleString()}`}
          />
        </Card>
      </div>

      <div className={styles.mainGrid}>
        <Card
          eyebrow="Players"
          title="プレイヤー表示"
          description="席順に並べたプレイヤーカードです。必要額やD/SB/BBバッジをセットアップの値から反映します。"
        >
          <div className={styles.playerList} aria-label="プレイヤー一覧">
            {players.map((player) => {
              const role = getRoleForIndex(hand, player.seatIndex);
              const committed = hand.contribThisStreet[player.id] ?? 0;
              const needed = calcCallNeeded(hand, player.id);
              return (
                <PlayerCard
                  key={player.id}
                  name={player.name}
                  role={role}
                  stack={player.stack}
                  committed={committed}
                  needed={needed}
                  status={statusText[player.state]}
                  isActive={player.id === hand.currentTurnPlayerId}
                  turnNote={player.id === hand.currentTurnPlayerId ? 'このプレイヤーの手番です。' : undefined}
                />
              );
            })}
          </div>
        </Card>

        <Card
          eyebrow="Actions"
          title="アクション入力の枠"
          description="ボタン群と導線をまとめるアクションバーの配置例です。セットアップからの状態を使ってモーダルを開きます。"
        >
          <div className={styles.actionStack}>
            <div className={styles.actionButtons}>
              <Button variant="primary" block onClick={() => setActionModalOpen(true)}>
                アクションを入力（モーダル想定）
              </Button>
              <Button variant="undo" block onClick={handleUndo}>
                Undo（直前を取り消す）
              </Button>
            </div>
            <div className={styles.secondaryActions}>
              <Button variant="secondary" onClick={appendDemoLog}>
                デモログを1件追加
              </Button>
              <Button variant="secondary">ログを確認</Button>
              <Button variant="secondary">ショーダウンへ</Button>
              <Button variant="danger">設定 / リセット</Button>
            </div>
            <div className={styles.navLinks}>
              <NavLink to="/log" className={styles.textLink}>
                /log に移動して履歴を一覧
              </NavLink>
              <NavLink to="/showdown" className={styles.textLink}>
                /showdown で勝者選択を確認
              </NavLink>
            </div>
            <p className={styles.actionNote}>
              モーダルを開くとアクション候補とベット/レイズ時の金額入力UIが表示されます。ここでは見た目と導線のみを固定しつつ、共有状態から値を受け取っています。ログ件数は現在 {hand.actionLog.length} 件で、Undo ボタンを押すと直近 1 件を巻き戻します。
            </p>
          </div>
        </Card>
      </div>

      <ActionModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        playerName={turnPlayer?.name ?? '—'}
        positionLabel={turnRole ?? '参加者'}
        potSize={potTotal}
        currentBet={hand.currentBet}
        callAmount={callNeeded}
        minBet={hand.currentBet}
        minRaiseTo={minRaiseTo}
        canRaise={canRaise}
        raiseDisabledReason={canRaise ? undefined : raiseDisabledReason}
        maxAmount={turnPlayer?.stack ?? 0}
      />
    </div>
  );
}
