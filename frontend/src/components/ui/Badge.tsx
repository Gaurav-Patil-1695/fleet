import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const ICONS: Record<BadgeVariant, string | null> = {
  success: '/src/assets/icons/success.svg',
  warning: '/src/assets/icons/warning.svg',
  error: '/src/assets/icons/error.svg',
  info: '/src/assets/icons/info.svg',
  neutral: null,
  accent: null,
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
}) => {
  const iconSrc = ICONS[variant];

  const classes = [
    styles.badge,
    styles[`badge--${variant}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          aria-hidden="true"
          className={styles.badge__icon}
        />
      )}
      <span className={styles.badge__label}>{children}</span>
    </span>
  );
};

export default Badge;
