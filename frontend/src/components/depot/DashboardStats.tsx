import React from 'react';
import styles from './DashboardStats.module.css';

interface DashboardStatsProps {
  totalVehicles: number;
  dueCount: number;
  overdueCount: number;
  activeWorkOrders: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalVehicles,
  dueCount,
  overdueCount,
  activeWorkOrders,
}) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statValue}>{totalVehicles}</span>
        <span className={styles.statLabel}>Total Vehicles</span>
      </div>
      <div className={`${styles.statCard} ${styles.statCardWarning}`}>
        <span className={styles.statValue}>{dueCount}</span>
        <span className={styles.statLabel}>Due for Service</span>
      </div>
      <div className={`${styles.statCard} ${styles.statCardError}`}>
        <span className={styles.statValue}>{overdueCount}</span>
        <span className={styles.statLabel}>Overdue</span>
      </div>
      <div className={`${styles.statCard} ${styles.statCardInfo}`}>
        <span className={styles.statValue}>{activeWorkOrders}</span>
        <span className={styles.statLabel}>Active Work Orders</span>
      </div>
    </div>
  );
};

export default DashboardStats;
