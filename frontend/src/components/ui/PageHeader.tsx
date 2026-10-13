import React from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  level?: 'display' | 'h1';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
  level = 'h1',
}) => {
  const classes = [
    styles.pageHeader,
    styles[`pageHeader--${level}`],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const TitleTag = level === 'display' ? 'h1' : 'h1';

  return (
    <header className={classes}>
      <div className={styles.pageHeader__text}>
        <TitleTag
          className={
            level === 'display'
              ? styles.pageHeader__title_display
              : styles.pageHeader__title_h1
          }
        >
          {title}
        </TitleTag>
        {subtitle && (
          <p className={styles.pageHeader__subtitle}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={styles.pageHeader__actions}>{actions}</div>
      )}
    </header>
  );
};

export default PageHeader;
