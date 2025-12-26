import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ActionModal } from '../components/ActionModal';
import { ActionBar } from '../components/ActionBar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PotPanel } from '../components/PotPanel';
import { PlayerCard, type PlayerStatus } from '../components/PlayerCard';
import { StatusBar } from '../components/StatusBar';
import { TurnPanel } from '../components/TurnPanel';
import { useToast } from '../components/Toast';
import { calcCallNeeded } from '../domain/bets';
import { ActionLogEntry, ActionType, HandState, PlayerState } from '../domain/types';
import { useGameState } from '../state/GameStateContext';
import { describeActionAvailability } from '../domain/actions';
import { buildTableViewModel, getRoleForIndex } from '../state/tableSelectors';
import { applyPlayerActionToState, PlayerActionInput } from '../state/actions';
import { useGameMachine } from '../state/gameMachine';
import styles from './TablePage.module.css';

interface TablePageProps {
  description: string;
}

const statusText: Record<PlayerState, PlayerStatus> = {
  ACTIVE: '参加中',
  FOLDED: 'フォールド',
  ALL_IN: 'オールイン',
};

const cloneHandState = (hand: HandState): HandState => JSON.parse(JSON.stringify(hand)) as HandState;

export function TablePage({ description }: TablePageProps) {
  const navigate = useNavigate();
  const { gameState, updateGameState } = useGameState();
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const { pushToast } = useToast();
  const { goToShowdown, returnToTablePhase, currentPhase } = useGameMachine();

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
  const {
    statusBarProps,
    turnPanelProps,
    potPanelProps,
    turnPlayer,
    turnRole,
    callNeeded,
    minRaiseTo,
    potTotal,
  } = buildTableViewModel(players, hand);

  const turnContribution = turnPlayer ? hand.contribThisStreet[turnPlayer.id] ?? 0 : 0;
  const maxReachableAmount = turnPlayer ? turnContribution + turnPlayer.stack : 0;
  const availableActions = turnPlayer ? describeActionAvailability(hand, turnPlayer) : [];

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
        players: lastEntry.playersSnapshot ?? prev.players,
        hand: {
          ...lastEntry.snapshot,
          actionLog: restoredActionLog,
        },
      };
    });
  };

  const handleConfirmAction = (actionInput: PlayerActionInput) => {
    updateGameState((prev) => {
      if (!prev) return prev;

      try {
        return applyPlayerActionToState(prev, actionInput);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        pushToast({
          title: 'アクションの適用に失敗しました',
          description: 'Undo またはログ/設定で状態を確認してください。',
          variant: 'danger',
          actionLabel: 'Undo を試す',
          onAction: handleUndo,
        });
        return prev;
      }
    });

    setActionModalOpen(false);
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
          ステータスバー、中央のポット表示、下部の手番パネルを上下に固定したレイアウトデモです。横持ちでも中央が崩れ
          ないよう余白を確保し、セットアップで入力した値をそのまま反映します。
        </p>
      </header>

      <section className={styles.tableFrame} aria-label="テーブルレイアウト">
        <div className={styles.statusRow}>
          <StatusBar {...statusBarProps} />
        </div>
        <div className={styles.middleRow}>
          <div className={styles.potAnchor}>
            <PotPanel {...potPanelProps} />
          </div>
        </div>
        <div className={styles.turnRow}>
          <TurnPanel {...turnPanelProps} />
        </div>
      </section>

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
          <ActionBar
            onPrimaryAction={() => setActionModalOpen(true)}
            onUndo={handleUndo}
            onShowLog={() => navigate('/log')}
            onOpenSettings={() => navigate('/settings')}
            logCount={hand.actionLog.length}
            isUndoDisabled={hand.actionLog.length === 0}
          />
          <div className={styles.navLinks}>
            <Button
              variant="secondary"
              onClick={returnToTablePhase}
              disabled={!gameState || currentPhase !== 'TABLE'}
            >
              戻る
            </Button>
            <Button variant="primary" onClick={goToShowdown} disabled={!gameState}>
              次へ
            </Button>
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
            モーダルを開くとアクション候補とベット/レイズ時の金額入力UIが表示されます。ここでは見た目と導線のみを
            固定しつつ、共有状態から値を受け取っています。ログ件数は現在 {hand.actionLog.length} 件で、Undo ボタンを
            押すと直近 1 件を巻き戻します。
          </p>
          <div className={styles.navLinks}>
            <Button variant="secondary" onClick={appendDemoLog}>
              デモログを1件追加
            </Button>
            <Button variant="secondary" onClick={() => navigate('/showdown')}>
              ショーダウンへ
            </Button>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Recovery"
        title="例外時の復旧ガイド"
        description="整合性が崩れたときに試せる導線をまとめました。Undo / ログ / 破棄の順に確認してください。"
      >
        <div className={styles.recoveryList}>
          <div className={styles.recoveryItem}>
            <div>
              <p className={styles.recoveryTitle}>Undo で直前の状態に戻す</p>
              <p className={styles.recoveryBody}>
                手番確定前のスナップショットを利用し、最後の 1 件だけ巻き戻します。画面が乱れた場合でもまずは Undo を試してくださ
さい。
              </p>
            </div>
            <div className={styles.recoveryActions}>
              <Button variant="undo" onClick={handleUndo}>
                直近の操作を取り消す
              </Button>
              <span className={styles.recoveryNote}>現在のログ件数: {hand.actionLog.length} 件</span>
            </div>
          </div>

          <div className={styles.recoveryItem}>
            <div>
              <p className={styles.recoveryTitle}>ログで直近の手順を確認</p>
              <p className={styles.recoveryBody}>
                直前の入力内容を確認し、必要なら再入力してください。ログにはスナップショット有無も記録されており、巻き戻しやすい
構成になっています。
              </p>
            </div>
            <div className={styles.recoveryActions}>
              <Button variant="secondary" onClick={() => navigate('/log')}>
                ログページを開く
              </Button>
              <NavLink to="/log" className={styles.textLink}>
                /log で時系列を確認
              </NavLink>
            </div>
          </div>

          <div className={styles.recoveryItem}>
            <div>
              <p className={styles.recoveryTitle}>ハンドを破棄してやり直す</p>
              <p className={styles.recoveryBody}>
                リロードしても復旧しない場合は、設定ページの「保存データを破棄」または「表示設定を初期化」からクリーンな状態に戻
してください。
              </p>
            </div>
            <div className={styles.recoveryActions}>
              <Button variant="danger" onClick={() => navigate('/settings')}>
                破棄/リセットを開く
              </Button>
              <span className={styles.recoveryNote}>破棄後はセットアップから再開できます</span>
            </div>
          </div>
        </div>
      </Card>

      <ActionModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        playerName={turnPlayer?.name ?? '—'}
        positionLabel={turnRole ?? '参加者'}
        potSize={potTotal}
        currentBet={hand.currentBet}
        callAmount={callNeeded}
        minBet={hand.lastRaiseSize}
        minRaiseTo={minRaiseTo}
        maxAmount={maxReachableAmount}
        stack={turnPlayer?.stack ?? 0}
        availableActions={availableActions}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
