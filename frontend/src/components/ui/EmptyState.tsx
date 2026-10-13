import React from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  const classes = [styles.emptyState, className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      {icon && (
        <div className={styles.emptyState__icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={styles.emptyState__title}>{title}</h3>
      {description && (
        <p className={styles.emptyState__description}>{description}</p>
      )}
      {action && (
        <div className={styles.emptyState__action}>{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
