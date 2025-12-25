import { useMemo, useState } from 'react';
import type { Player, PlayerId, PotState } from '../domain/types';
import styles from './PotPanel.module.css';

const formatAmount = (amount: number) => amount.toLocaleString();

const resolveEligibleNames = (playerIds: PlayerId[], players: Player[]) =>
  playerIds
    .map((id) => players.find((player) => player.id === id)?.name ?? id)
    .filter((name) => name.length > 0);

const buildMainEligibleNames = (players: Player[]) =>
  [...players]
    .filter((player) => player.state !== 'FOLDED')
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map((player) => player.name);

interface PotPanelProps {
  pot: PotState;
  players: Player[];
}

interface PotBreakdownRowProps {
  label: string;
  amount: number;
  eligibleNames: string[];
}

const PotBreakdownRow = ({ label, amount, eligibleNames }: PotBreakdownRowProps) => (
  <div className={styles.breakdownRow}>
    <div className={styles.rowHeading}>
      <span className={styles.potLabel}>{label}</span>
      <span className={styles.amount}>{formatAmount(amount)}</span>
    </div>
    <p className={styles.eligible}>
      対象: {eligibleNames.length > 0 ? eligibleNames.join(' / ') : '—'}
    </p>
  </div>
);

export function PotPanel({ pot, players }: PotPanelProps) {
  const [open, setOpen] = useState(false);

  const total = useMemo(
    () => pot.main + pot.sides.reduce((sum, side) => sum + side.amount, 0),
    [pot.main, pot.sides],
  );

  const mainEligibleNames = useMemo(() => buildMainEligibleNames(players), [players]);

  return (
    <div className={styles.panel}>
      <div className={styles.summary}>
        <div>
          <p className={styles.summaryLabel}>ポット合計</p>
          <p className={styles.summaryTotal}>{formatAmount(total)}</p>
        </div>
        <div className={styles.summaryActions}>
          <div className={styles.badgeGroup}>
            <span className={styles.badge}>Main</span>
            {pot.sides.length > 0 && <span className={styles.badge}>Side × {pot.sides.length}</span>}
          </div>
          <button type="button" className={styles.toggleButton} onClick={() => setOpen((prev) => !prev)}>
            {open ? '内訳をたたむ' : '内訳を表示'}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.breakdown} aria-live="polite">
          <PotBreakdownRow label="メインポット" amount={pot.main} eligibleNames={mainEligibleNames} />

          {pot.sides.map((side, index) => (
            <PotBreakdownRow
              key={`side-${index}`}
              label={`サイドポット ${index + 1}`}
              amount={side.amount}
              eligibleNames={resolveEligibleNames(side.eligiblePlayerIds, players)}
            />
          ))}

          {pot.sides.length === 0 && <p className={styles.empty}>サイドポットは未発生です。</p>}
        </div>
      )}
    </div>
  );
}
