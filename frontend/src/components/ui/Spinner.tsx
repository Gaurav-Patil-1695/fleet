import React from 'react';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading…',
  className,
}) => {
  const classes = [
    styles.spinner,
    styles[`spinner--${size}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={styles.spinner__wrapper}
      role="status"
      aria-label={label}
    >
      <span className={classes} aria-hidden="true" />
      <span className={styles['spinner__sr-only']}>{label}</span>
    </span>
  );
};

export default Spinner;
