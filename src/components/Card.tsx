import { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'nav';
  title?: string;
  eyebrow?: string;
  description?: ReactNode;
}

export function Card({
  as: Element = 'article',
  title,
  eyebrow,
  description,
  className,
  children,
  ...props
}: CardProps) {
  const classes = [styles.card, className].filter(Boolean).join(' ');

  return (
    <Element className={classes} {...props}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.body}>{description}</p>}
      <div className={styles.content}>{children}</div>
    </Element>
  );
}
