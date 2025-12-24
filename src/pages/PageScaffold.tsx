import { NavLink } from 'react-router-dom';
import { Card } from '../components/Card';
import styles from './PageScaffold.module.css';

type ActionLink = {
  to: string;
  label: string;
};

interface PageScaffoldProps {
  path: string;
  title: string;
  description: string;
  summary: string;
  checkpoints: string[];
  links?: ActionLink[];
  includeHomeLink?: boolean;
  footnote?: string;
}

export function PageScaffold({
  path,
  title,
  description,
  summary,
  checkpoints,
  links = [],
  includeHomeLink = true,
  footnote = 'このページは骨組みのプレースホルダーです。後続タスクでロジックやUIを追加します。',
}: PageScaffoldProps) {
  const navLinks = includeHomeLink ? [...links, { to: '/', label: 'ホームへ戻る' }] : links;

  return (
    <Card eyebrow={path} title={title} description={description} className={styles.pageCard}>
      <p className={styles.lead}>{summary}</p>
      <ul className={styles.checklist}>
        {checkpoints.map((item) => (
          <li key={item} className={styles.checklistItem}>
            {item}
          </li>
        ))}
      </ul>

      {navLinks.length > 0 && (
        <div className={styles.actions} aria-label={`${title}の導線`}>
          {navLinks.map((link) => (
            <NavLink
              key={`${link.to}-${link.label}`}
              to={link.to}
              className={({ isActive }) =>
                `${styles.actionLink}${isActive ? ` ${styles.actionLinkActive}` : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {footnote && <p className={styles.note}>{footnote}</p>}
    </Card>
  );
}
