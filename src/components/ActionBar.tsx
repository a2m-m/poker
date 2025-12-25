import styles from './ActionBar.module.css';
import { Button } from './Button';

export type ActionBarProps = {
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  onUndo: () => void;
  onShowLog: () => void;
  onOpenSettings: () => void;
  logCount?: number;
  isUndoDisabled?: boolean;
};

export const ActionBar = ({
  onPrimaryAction,
  primaryLabel = 'アクションを入力',
  onUndo,
  onShowLog,
  onOpenSettings,
  logCount,
  isUndoDisabled,
}: ActionBarProps) => {
  return (
    <div className={styles.bar} aria-label="テーブル下部の操作バー">
      <div className={styles.primary}>
        <div className={styles.meta}>
          <p className={styles.title}>操作</p>
          <p className={styles.note}>
            Undo / ログ / 設定をひとまとめにしています。
          </p>
          {typeof logCount === 'number' && (
            <p className={styles.note}>現在のログ件数: {logCount} 件</p>
          )}
        </div>
        {onPrimaryAction && (
          <Button variant="primary" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
        )}
        <Button variant="undo" onClick={onUndo} disabled={isUndoDisabled}>
          Undo（直前を取り消す）
        </Button>
      </div>
      <div className={styles.divider} aria-hidden />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onShowLog}>
          ログを確認
        </Button>
        <Button variant="danger" onClick={onOpenSettings}>
          設定 / リセット
        </Button>
      </div>
    </div>
  );
};
