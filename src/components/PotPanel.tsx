import { useState } from 'react';
import styles from './PotPanel.module.css';

interface PotBreakdownRowProps {
  label: string;
  amountText: string;
  eligibleNames: string[];
}

const PotBreakdownRow = ({ label, amountText, eligibleNames }: PotBreakdownRowProps) => (
  <div className={styles.breakdownRow}>
    <div className={styles.rowHeading}>
      <span className={styles.potLabel}>{label}</span>
      <span className={styles.amount}>{amountText}</span>
    </div>
    <p className={styles.eligible}>
      対象: {eligibleNames.length > 0 ? eligibleNames.join(' / ') : '—'}
    </p>
  </div>
);

type PotPanelProps = {
  totalText: string;
  sideCount: number;
  breakdown: PotBreakdownRowProps[];
};

export function PotPanel({ totalText, sideCount, breakdown }: PotPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <div className={styles.summary}>
        <div>
          <p className={styles.summaryLabel}>ポット合計</p>
          <p className={styles.summaryTotal}>{totalText}</p>
        </div>
        <div className={styles.summaryActions}>
          <div className={styles.badgeGroup}>
            <span className={styles.badge}>Main</span>
            {sideCount > 0 && <span className={styles.badge}>Side × {sideCount}</span>}
          </div>
          <button type="button" className={styles.toggleButton} onClick={() => setOpen((prev) => !prev)}>
            {open ? '内訳をたたむ' : '内訳を表示'}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.breakdown} aria-live="polite">
          {breakdown.map((row) => (
            <PotBreakdownRow
              key={`${row.label}-${row.amountText}`}
              label={row.label}
              amountText={row.amountText}
              eligibleNames={row.eligibleNames}
            />
          ))}

          {breakdown.length === 0 && <p className={styles.empty}>サイドポットは未発生です。</p>}
        </div>
      )}
    </div>
  );
}
