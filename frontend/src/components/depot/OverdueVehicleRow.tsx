import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';
import { formatOdometer } from '../../utils/odometerUtils';
import styles from './OverdueVehicleRow.module.css';

interface OverdueVehicleRowProps {
  vehicle: Vehicle;
}

function getServiceOverdueLabel(vehicle: Vehicle): string {
  const parts: string[] = [];
  if (vehicle.next_service_due_date) {
    parts.push(`Was due ${formatDate(vehicle.next_service_due_date)}`);
  }
  if (vehicle.next_service_due_odometer_km != null) {
    parts.push(`at ${formatOdometer(vehicle.next_service_due_odometer_km)}`);
  }
  return parts.length > 0 ? parts.join(' ') : 'Service overdue';
}

const OverdueVehicleRow: React.FC<OverdueVehicleRowProps> = ({ vehicle }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/vehicles/${vehicle.id}`);
    }
  };

  return (
    <tr
      className={styles.row}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${vehicle.registration_number} (overdue service)`}
    >
      <td className={styles.cell}>
        <span className={styles.overdueIcon} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 1.5L14.5 13H1.5L8 1.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 6V9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
          </svg>
        </span>
        <span className={styles.regNumber}>{vehicle.registration_number}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.makeModel}>
          {vehicle.make} {vehicle.model}
        </span>
      </td>
      <td className={styles.cell}>
        <span className={styles.serviceOverdue}>{getServiceOverdueLabel(vehicle)}</span>
      </td>
      <td className={styles.cell}>
        {vehicle.last_known_odometer_km != null ? (
          <span className={styles.odometer}>
            {formatOdometer(vehicle.last_known_odometer_km)}
          </span>
        ) : (
          <span className={styles.odometer}>—</span>
        )}
      </td>
      <td className={styles.cell}>
        <Badge variant="error">Overdue</Badge>
      </td>
      <td className={styles.cell}>
        {vehicle.has_telematics ? (
          <span className={styles.telematicsIndicator} title="Telematics enabled">
            Live
          </span>
        ) : (
          <span className={styles.manualIndicator} title="Manual readings only">
            Manual
          </span>
        )}
      </td>
    </tr>
  );
};

export default OverdueVehicleRow;
