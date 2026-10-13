import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  as: Component = 'div',
}) => {
  const classes = [styles.card, className ?? ''].filter(Boolean).join(' ');

  return <Component className={classes}>{children}</Component>;
};

export default Card;
