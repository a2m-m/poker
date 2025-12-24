import styles from './TurnPanel.module.css';

type TurnRowProps = {
  label: string;
  value: string;
  note?: string;
};

function TurnRow({ label, value, note }: TurnRowProps) {
  return (
    <div className={styles.turnRow}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {note && <span className={styles.note}>（{note}）</span>}
      </span>
    </div>
  );
}

export type TurnPanelProps = {
  turnPlayer: string;
  positionLabel?: string;
  requiredText: string;
  availableText: string;
};

export function TurnPanel({ turnPlayer, positionLabel, requiredText, availableText }: TurnPanelProps) {
  const playerDisplay = turnPlayer || '—';

  return (
    <div className={styles.turnPanel} aria-label="手番情報">
      <TurnRow label="手番" value={playerDisplay} note={positionLabel} />
      <TurnRow label="必要" value={requiredText} />
      <TurnRow label="可能" value={availableText} />
    </div>
  );
}
