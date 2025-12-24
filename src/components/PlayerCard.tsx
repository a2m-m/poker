import styles from './PlayerCard.module.css';

export type PlayerRole = 'D' | 'SB' | 'BB';
export type PlayerStatus = '参加中' | 'フォールド' | 'オールイン';

export type PlayerCardProps = {
  name: string;
  role?: PlayerRole;
  stack: number;
  committed: number;
  needed: number;
  status: PlayerStatus;
  isActive?: boolean;
  turnNote?: string;
};

const statusClassName: Record<PlayerStatus, string> = {
  参加中: styles.statusActive,
  フォールド: styles.statusFold,
  オールイン: styles.statusAllIn,
};

export function PlayerCard({
  name,
  role,
  stack,
  committed,
  needed,
  status,
  isActive = false,
  turnNote,
}: PlayerCardProps) {
  return (
    <div className={`${styles.card}${isActive ? ` ${styles.active}` : ''}`}>
      <div className={styles.header}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{name}</span>
          {role && <span className={styles.roleBadge}>{role}</span>}
        </div>
        <span className={`${styles.statusBadge} ${statusClassName[status]}`}>{status}</span>
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>残スタック</dt>
          <dd>{stack.toLocaleString()}</dd>
        </div>
        <div>
          <dt>ストリート投入</dt>
          <dd>{committed.toLocaleString()}</dd>
        </div>
        <div>
          <dt>必要額</dt>
          <dd className={styles.neededValue}>{needed > 0 ? `必要 ${needed.toLocaleString()}` : '必要なし'}</dd>
        </div>
      </dl>

      {turnNote && <p className={styles.turnNote}>{turnNote}</p>}
    </div>
  );
}
