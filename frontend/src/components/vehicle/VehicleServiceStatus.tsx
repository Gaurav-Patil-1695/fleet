import React from 'react';
import { Vehicle } from '../../types/vehicle';
import Badge from '../ui/Badge';
import styles from './VehicleServiceStatus.module.css';
import { formatDate } from '../../utils/dateUtils';
import { formatOdometer } from '../../utils/odometerUtils';

interface VehicleServiceStatusProps {
  vehicle: Vehicle;
}

type ServiceStatusLevel = 'ok' | 'due-soon' | 'overdue' | 'unknown';

function getServiceStatusLevel(vehicle: Vehicle): ServiceStatusLevel {
  if (!vehicle.next_service_due_date && vehicle.next_service_due_odometer_km == null) {
    return 'unknown';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueSoon = false;
  let overdue = false;

  if (vehicle.next_service_due_date) {
    const dueDate = new Date(vehicle.next_service_due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      overdue = true;
    } else if (diffDays <= 30) {
      dueSoon = true;
    }
  }

  if (
    vehicle.next_service_due_odometer_km != null &&
    vehicle.last_known_odometer_km != null
  ) {
    const remaining = vehicle.next_service_due_odometer_km - vehicle.last_known_odometer_km;
    if (remaining < 0) {
      overdue = true;
    } else if (remaining <= 1000) {
      dueSoon = true;
    }
  }

  if (overdue) return 'overdue';
  if (dueSoon) return 'due-soon';
  return 'ok';
}

function getStatusBadgeVariant(
  level: ServiceStatusLevel
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (level) {
    case 'ok':
      return 'success';
    case 'due-soon':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'neutral';
  }
}

function getStatusLabel(level: ServiceStatusLevel): string {
  switch (level) {
    case 'ok':
      return 'Service OK';
    case 'due-soon':
      return 'Due Soon';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Unknown';
  }
}

const VehicleServiceStatus: React.FC<VehicleServiceStatusProps> = ({ vehicle }) => {
  const level = getServiceStatusLevel(vehicle);
  const badgeVariant = getStatusBadgeVariant(level);
  const statusLabel = getStatusLabel(level);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Service Status</span>
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
      </div>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>Next Service Date</span>
          <span className={styles.value}>
            {vehicle.next_service_due_date
              ? formatDate(vehicle.next_service_due_date)
              : <span className={styles.noData}>Not set</span>}
          </span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Next Service Odometer</span>
          <span className={styles.value}>
            {vehicle.next_service_due_odometer_km != null
              ? formatOdometer(vehicle.next_service_due_odometer_km)
              : <span className={styles.noData}>Not set</span>}
          </span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Last Serviced</span>
          <span className={styles.value}>
            {vehicle.last_serviced_at
              ? formatDate(vehicle.last_serviced_at)
              : <span className={styles.noData}>Never</span>}
          </span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Last Service Odometer</span>
          <span className={styles.value}>
            {vehicle.last_serviced_odometer_km != null
              ? formatOdometer(vehicle.last_serviced_odometer_km)
              : <span className={styles.noData}>—</span>}
          </span>
        </div>

        <div className={styles.item}>
          <span className={styles.label}>Current Odometer</span>
          <span className={styles.value}>
            {vehicle.last_known_odometer_km != null
              ? formatOdometer(vehicle.last_known_odometer_km)
              : <span className={styles.noData}>No reading</span>}
          </span>
        </div>

        {vehicle.last_odometer_recorded_at && (
          <div className={styles.item}>
            <span className={styles.label}>Reading Recorded</span>
            <span className={styles.value}>
              {formatDate(vehicle.last_odometer_recorded_at)}
            </span>
          </div>
        )}
      </div>

      {level === 'overdue' && (
        <div className={styles.alertBanner} role="alert">
          <span className={styles.alertIcon} aria-hidden="true">⚠</span>
          This vehicle is overdue for service.
        </div>
      )}

      {level === 'due-soon' && (
        <div className={styles.warningBanner} role="status">
          <span className={styles.warningIcon} aria-hidden="true">⚠</span>
          Service is due soon. Please schedule maintenance.
        </div>
      )}
    </div>
  );
};

export default VehicleServiceStatus;
