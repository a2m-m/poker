import { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'undo';
type ButtonSize = 'medium' | 'small';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  block = false,
  size = 'medium',
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size]];

  if (block) {
    classes.push(styles.block);
  }

  if (className) {
    classes.push(className);
  }

  return (
    <button className={classes.join(' ')} {...props}>
      {children}
    </button>
  );
}
