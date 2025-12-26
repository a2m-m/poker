import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useGameState } from '../state/GameStateContext';
import { getResumeAvailability } from '../state/selectors';
import styles from './HomePage.module.css';

interface HomePageProps {
  description: string;
}

export function HomePage({ description }: HomePageProps) {
  const navigate = useNavigate();
  const [activeDialog, setActiveDialog] = useState<'resume' | 'reset' | null>(null);
  const { gameState, clearGameState, hasCorruptedSave } = useGameState();
  const resumeAvailability = useMemo(() => getResumeAvailability(gameState), [gameState]);
  const isDev = import.meta.env.DEV;

  const handleNewGame = () => {
    navigate('/setup');
  };

  const handleResume = () => {
    if (resumeAvailability.reason) return;
    setActiveDialog('resume');
  };

  const handleResetRequest = () => {
    setActiveDialog('reset');
  };

  const handleResetConfirm = () => {
    clearGameState();
    setActiveDialog(null);
  };

  const handleResetCancel = () => {
    setActiveDialog(null);
  };

  const handleResumeConfirm = () => {
    if (resumeAvailability.reason) {
      setActiveDialog(null);
      return;
    }
    navigate('/table');
  };

  const dialogTitle =
    activeDialog === 'resume' ? '前回の状態で再開しますか？' : '保存データをリセットしますか？';

  const dialogMessage =
    activeDialog === 'resume'
      ? '保存済みのゲーム状態を読み込み、テーブルに移動します。必要に応じてセットアップで編集してください。'
      : '保存済みのゲーム状態を削除します。リロード後も再開できなくなります。';

  const dialogConfirmLabel = activeDialog === 'resume' ? 'テーブルに移動する' : 'リセットする';
  const dialogCancelLabel = activeDialog === 'resume' ? 'キャンセル' : 'やめておく';
  const dialogTone = activeDialog === 'resume' ? 'default' : 'danger';
  const isDialogOpen = activeDialog !== null;

  const resumeDisabledReason = resumeAvailability.reason;
  const resumeDisabled = !!resumeDisabledReason;

  const resumeNote = resumeDisabledReason ?? '保存済みのゲームがあるときのみ再開できます。';

  return (
    <div className={styles.home}>
      <div className={styles.heroRow}>
        <Card
          eyebrow="Start"
          title="Poker Dealer App"
          description={description}
          className={styles.card}
        >
          <p className={styles.lead}>
            「新規開始」「再開」「リセット」の 3 操作を起点に、セットアップやテーブル表示へ進むホーム画面です。
            まだロジックは仮ですが、導線の位置とトーンを固定しておきます。
          </p>
          {hasCorruptedSave && (
            <div className={styles.warning} role="alert">
              <p className={styles.warningTitle}>保存データをリセットしました</p>
              <p className={styles.warningBody}>
                破損した保存データを検出したため削除しました。新規ゲームを開始するか、必要に応じてリセットを実行してください。
              </p>
            </div>
          )}
          <div className={styles.actions}>
            <Button variant="primary" block onClick={handleNewGame}>
              新規ゲームを開始
            </Button>
            <Button variant="secondary" block onClick={handleResume} disabled={resumeDisabled}>
              前回を再開（デモ）
            </Button>
            <Button variant="danger" block onClick={handleResetRequest}>
              リセット（全削除）
            </Button>
          </div>
          <p className={styles.note}>{resumeNote}</p>
          <p className={styles.note}>
            セットアップで開始したゲーム状態はブラウザに一時保存され、リロード後でも「前回を再開」からテーブルに戻れるようになりました。
          </p>
        </Card>

        <Card
          eyebrow="Progress"
          title="進行中のハンドに戻る"
          description="保存データがある想定で、テーブルやログへ最短遷移できるショートカットをまとめています。"
          className={styles.card}
        >
          <dl className={styles.metaList}>
            <div>
              <dt>ステータス</dt>
              <dd className={styles.badge}>デモデータ</dd>
            </div>
            <div>
              <dt>想定ハンド</dt>
              <dd>#12 / リバー進行中</dd>
            </div>
            <div>
              <dt>次の手番</dt>
              <dd>プレイヤー: 佐藤</dd>
            </div>
          </dl>
          <div className={styles.quickLinks} aria-label="進行中ハンドへの導線">
            <NavLink to="/table" className={styles.navLink}>
              テーブルに移動
              <span className={styles.navHint}>手番の確認とアクション入力</span>
            </NavLink>
            <NavLink to="/log" className={styles.navLink}>
              ログを確認
              <span className={styles.navHint}>直近の操作履歴を一覧</span>
            </NavLink>
            <NavLink to="/showdown" className={styles.navLink}>
              ショーダウンへ
              <span className={styles.navHint}>勝者選択とサイドポット確認</span>
            </NavLink>
          </div>
        </Card>
      </div>

      <Card
        eyebrow="Demo"
        title="ページ骨組みのショートカット"
        description="各ページのモックに移動できます。HashRouter 配信のため、#/setup など直接入力でも安全にアクセスできます。"
        className={styles.card}
      >
        <ul className={styles.pageList}>
          <li>
            <NavLink to="/setup" className={styles.pageLink}>
              <span className={styles.pageTitle}>セットアップ</span>
              <span className={styles.pageDescription}>プレイヤー編集とブラインド設定の予定地</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/table" className={styles.pageLink}>
              <span className={styles.pageTitle}>テーブル</span>
              <span className={styles.pageDescription}>進行中ハンドを表示するメインビュー</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/payout" className={styles.pageLink}>
              <span className={styles.pageTitle}>配当結果</span>
              <span className={styles.pageDescription}>サイドポット配当の結果確認</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={styles.pageLink}>
              <span className={styles.pageTitle}>設定</span>
              <span className={styles.pageDescription}>保存/復元やリセット操作の入口</span>
            </NavLink>
          </li>
          {isDev && (
            <li>
              <NavLink to="/preview" className={styles.pageLink}>
                <span className={styles.pageTitle}>プレビュー</span>
                <span className={styles.pageDescription}>ダミー状態を切り替えて各ページを確認</span>
              </NavLink>
            </li>
          )}
        </ul>
        <p className={styles.note}>
          いずれも UI 骨組みのみのプレースホルダーです。ルーティングと導線のトーンを先に整え、後続タスクで中身を差し込みます。
        </p>
      </Card>

      <ConfirmDialog
        open={isDialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        confirmLabel={dialogConfirmLabel}
        cancelLabel={dialogCancelLabel}
        tone={dialogTone}
        onConfirm={activeDialog === 'resume' ? handleResumeConfirm : handleResetConfirm}
        onCancel={handleResetCancel}
      />
    </div>
  );
}
