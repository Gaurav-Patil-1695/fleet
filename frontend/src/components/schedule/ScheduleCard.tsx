import React from 'react';
import type { Schedule } from '../../types/schedule';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import styles from './ScheduleCard.module.css';

interface ScheduleCardProps {
  schedule: Schedule;
  vehicleTypeName?: string;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
}

function formatVehicleClass(vehicleClass: string): string {
  switch (vehicleClass) {
    case 'heavy_truck':
      return 'Heavy Truck';
    case 'light_commercial':
      return 'Light Commercial';
    case 'other':
      return 'Other';
    default:
      return vehicleClass;
  }
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  vehicleTypeName,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            {vehicleTypeName ?? 'Vehicle Type'}
          </h3>
          <Badge variant={schedule.is_active ? 'success' : 'neutral'}>
            {schedule.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <span className={styles.vehicleClass}>
          {formatVehicleClass(schedule.vehicle_class)}
        </span>
      </div>

      <div className={styles.intervals}>
        <div className={styles.intervalItem}>
          <span className={styles.intervalLabel}>KM Interval</span>
          <span className={styles.intervalValue}>
            {schedule.km_interval.toLocaleString()} km
          </span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.intervalItem}>
          <span className={styles.intervalLabel}>Month Interval</span>
          <span className={styles.intervalValue}>
            {schedule.month_interval}{' '}
            {schedule.month_interval === 1 ? 'month' : 'months'}
          </span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && (
            <button
              className={styles.actionBtn}
              onClick={() => onEdit(schedule)}
              type="button"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => onDelete(schedule)}
              type="button"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScheduleCard;
