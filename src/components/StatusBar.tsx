import styles from './StatusBar.module.css';

type StatusBarProps = {
  handLabel: string;
  streetLabel: string;
  goalText: string;
  currentBetText: string;
  callNeededText: string;
  callHighlight?: boolean;
  minRaiseText: string;
  buttonLabel: string;
  buttonBadge?: string;
  blindLabel: string;
  blindBadge?: string;
};

type StatusItemProps = {
  label: string;
  value: string;
  highlight?: boolean;
  emphasize?: boolean;
  badge?: string;
};

function StatusItem({ label, value, badge, highlight, emphasize }: StatusItemProps) {
  return (
    <div className={`${styles.statusItem}${highlight ? ` ${styles.statusItemHighlight}` : ''}`}>
      <p className={styles.statusLabel}>{label}</p>
      <div className={styles.statusValueRow}>
        <span className={`${styles.statusValue}${emphasize ? ` ${styles.statusValueEmphasis}` : ''}`}>
          {value}
        </span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
    </div>
  );
}

export function StatusBar({
  handLabel,
  streetLabel,
  goalText,
  currentBetText,
  callNeededText,
  callHighlight,
  minRaiseText,
  buttonLabel,
  buttonBadge,
  blindLabel,
  blindBadge,
}: StatusBarProps) {
  return (
    <div className={styles.statusBar} aria-label="ステータスバー">
      <StatusItem label="ハンド" value={handLabel} />
      <StatusItem label="ストリート" value={streetLabel} />
      <StatusItem label="目標" value={goalText} emphasize />
      <StatusItem label="現在ベット" value={currentBetText} />
      <StatusItem label="コール必要額" value={callNeededText} highlight={callHighlight} />
      <StatusItem label="最小レイズ" value={minRaiseText} />
      <StatusItem label="ボタン" value={buttonLabel} badge={buttonBadge} />
      <StatusItem label="ブラインド" value={blindLabel} badge={blindBadge} />
    </div>
  );
}
