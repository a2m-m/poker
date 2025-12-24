import styles from './StatusBar.module.css';

type StatusBarProps = {
  handNumber: number | string;
  street: string;
  goal: string;
  currentBet: number;
  callNeeded: number;
  minRaise: number;
  buttonPlayer?: string;
  smallBlindPlayer?: string;
  bigBlindPlayer?: string;
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
  handNumber,
  street,
  goal,
  currentBet,
  callNeeded,
  minRaise,
  buttonPlayer,
  smallBlindPlayer,
  bigBlindPlayer,
}: StatusBarProps) {
  const buttonDisplay = buttonPlayer ?? '—';
  const blindDisplay = `${smallBlindPlayer ?? '—'} / ${bigBlindPlayer ?? '—'}`;

  return (
    <div className={styles.statusBar} aria-label="ステータスバー">
      <StatusItem label="ハンド" value={`#${handNumber}`} />
      <StatusItem label="ストリート" value={street} />
      <StatusItem label="目標" value={goal} emphasize />
      <StatusItem label="現在ベット" value={currentBet.toLocaleString()} />
      <StatusItem label="コール必要額" value={callNeeded.toLocaleString()} highlight={callNeeded > 0} />
      <StatusItem label="最小レイズ" value={minRaise.toLocaleString()} />
      <StatusItem label="ボタン" value={buttonDisplay} badge={buttonPlayer ? 'D' : undefined} />
      <StatusItem label="ブラインド" value={blindDisplay} badge={smallBlindPlayer || bigBlindPlayer ? 'SB / BB' : undefined} />
    </div>
  );
}
