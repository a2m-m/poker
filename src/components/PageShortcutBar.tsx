import styles from './PageShortcutBar.module.css';
import { Button, type ButtonVariant } from './Button';

export type ShortcutAction = {
  label: string;
  description: string;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  disabledReason?: string | null;
};

interface PageShortcutBarProps {
  title?: string;
  actions: ShortcutAction[];
}

export const PageShortcutBar = ({ title = 'ページのショートカット', actions }: PageShortcutBarProps) => {
  return (
    <div className={styles.bar} aria-label={title}>
      {actions.map((action) => (
        <div key={`${action.label}-${action.description}`} className={styles.item}>
          <Button
            variant={action.variant ?? 'secondary'}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.description}
            aria-label={`${action.label}（${action.description}）`}
          >
            {action.label}
          </Button>
          <p className={styles.hint} role={action.disabled ? 'status' : undefined}>
            {action.disabled && action.disabledReason ? action.disabledReason : action.description}
          </p>
        </div>
      ))}
    </div>
  );
};
