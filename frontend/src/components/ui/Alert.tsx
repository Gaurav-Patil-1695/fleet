import React from 'react';
import styles from './Alert.module.css';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  message: React.ReactNode;
  title?: string;
  className?: string;
  onDismiss?: () => void;
}

const ICON_SRC: Record<AlertVariant, string> = {
  success: '/src/assets/icons/success.svg',
  warning: '/src/assets/icons/warning.svg',
  error: '/src/assets/icons/error.svg',
  info: '/src/assets/icons/info.svg',
};

const ARIA_ROLE: Record<AlertVariant, string> = {
  success: 'status',
  warning: 'alert',
  error: 'alert',
  info: 'status',
};

const Alert: React.FC<AlertProps> = ({
  variant,
  message,
  title,
  className,
  onDismiss,
}) => {
  const classes = [
    styles.alert,
    styles[`alert--${variant}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      role={ARIA_ROLE[variant]}
      aria-live={variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'}
    >
      <img
        src={ICON_SRC[variant]}
        alt=""
        aria-hidden="true"
        className={styles.alert__icon}
      />
      <div className={styles.alert__content}>
        {title && (
          <span className={styles.alert__title}>{title}</span>
        )}
        <span className={styles.alert__message}>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles.alert__dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
