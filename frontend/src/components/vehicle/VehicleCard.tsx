import React from 'react';
import { Vehicle } from '../../types/vehicle';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import styles from './VehicleCard.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  depotName?: string;
  vehicleTypeName?: string;
  onClick?: () => void;
}

function getStatusVariant(status: Vehicle['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'decommissioned':
      return 'error';
    default:
      return 'neutral';
  }
}

function formatStatusLabel(status: Vehicle['status']): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'decommissioned':
      return 'Decommissioned';
    default:
      return status;
  }
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  depotName,
  vehicleTypeName,
  onClick,
}) => {
  return (
    <div
      className={`${styles.vehicleCard} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className={styles.header}>
        <span className={styles.registration}>{vehicle.registration_number}</span>
        <Badge variant={getStatusVariant(vehicle.status)}>
          {formatStatusLabel(vehicle.status)}
        </Badge>
      </div>

      <div className={styles.makeModel}>
        {vehicle.make} {vehicle.model}
      </div>

      <div className={styles.meta}>
        {vehicleTypeName && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Type</span>
            <span className={styles.metaValue}>{vehicleTypeName}</span>
          </div>
        )}
        {depotName && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Depot</span>
            <span className={styles.metaValue}>{depotName}</span>
          </div>
        )}
        {vehicle.last_known_odometer_km != null && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Odometer</span>
            <span className={styles.metaValue}>
              {vehicle.last_known_odometer_km.toLocaleString()} km
            </span>
          </div>
        )}
        {vehicle.next_service_due_date && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Next Service</span>
            <span className={styles.metaValue}>{vehicle.next_service_due_date}</span>
          </div>
        )}
      </div>

      {vehicle.has_telematics && (
        <div className={styles.telematicsTag}>
          <span className={styles.telematicsDot} aria-hidden="true" />
          Telematics
        </div>
      )}
    </div>
  );
};

export default VehicleCard;
