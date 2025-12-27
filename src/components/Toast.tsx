import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
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

type ToastContextValue = {
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastStackProps {
  toasts: ToastMessage[];
  onClose: (_id: string) => void;
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

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast は ToastProvider 配下でのみ使用してください');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const clearToasts = useCallback(() => setToasts([]), []);

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      removeToast,
      clearToasts,
    }),
    [toasts, pushToast, removeToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};
