import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';
import { formatOdometer } from '../../utils/odometerUtils';
import styles from './DueVehicleRow.module.css';

interface DueVehicleRowProps {
  vehicle: Vehicle;
}

function getServiceDueLabel(vehicle: Vehicle): string {
  const parts: string[] = [];
  if (vehicle.next_service_due_date) {
    parts.push(`By ${formatDate(vehicle.next_service_due_date)}`);
  }
  if (vehicle.next_service_due_odometer_km != null) {
    parts.push(`or ${formatOdometer(vehicle.next_service_due_odometer_km)}`);
  }
  return parts.length > 0 ? parts.join(' ') : 'Service due';
}

const DueVehicleRow: React.FC<DueVehicleRowProps> = ({ vehicle }) => {
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
      aria-label={`View details for ${vehicle.registration_number}`}
    >
      <td className={styles.cell}>
        <span className={styles.regNumber}>{vehicle.registration_number}</span>
      </td>
      <td className={styles.cell}>
        <span className={styles.makeModel}>
          {vehicle.make} {vehicle.model}
        </span>
      </td>
      <td className={styles.cell}>
        <span className={styles.serviceDue}>{getServiceDueLabel(vehicle)}</span>
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
        <Badge variant="warning">Due</Badge>
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

export default DueVehicleRow;
