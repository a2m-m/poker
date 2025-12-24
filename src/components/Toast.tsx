import styles from './Toast.module.css';
import { Button } from './Button';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
};

interface ToastStackProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastStack({ toasts, onClose }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`${styles.toast} ${styles[toast.variant ?? 'info']}`}
          aria-label={toast.title}
        >
          <div>
            <p className={styles.title}>{toast.title}</p>
            {toast.description && <p className={styles.description}>{toast.description}</p>}
          </div>
          <div className={styles.actions}>
            {toast.actionLabel && toast.onAction && (
              <Button size="small" variant="secondary" onClick={toast.onAction}>
                {toast.actionLabel}
              </Button>
            )}
            <button className={styles.closeButton} aria-label="閉じる" onClick={() => onClose(toast.id)}>
              ✕
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
