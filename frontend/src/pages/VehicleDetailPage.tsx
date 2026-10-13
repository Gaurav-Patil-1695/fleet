import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVehicleDetail } from '../hooks/useVehicleDetail';
import { useReadings } from '../hooks/useReadings';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { usePermission } from '../hooks/usePermission';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatOdometer } from '../utils/odometerUtils';
import type { WorkOrder } from '../types/workOrder';
import type { Reading } from '../types/reading';
import styles from './VehicleDetailPage.module.css';

function getStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'active':
      return {
        background: 'var(--color-success-light)',
        color: 'var(--color-ink)',
        border: 'none',
      };
    case 'inactive':
      return {
        background: 'var(--color-warning-light)',
        color: 'var(--color-ink)',
        border: 'none',
      };
    case 'decommissioned':
      return {
        background: 'var(--color-surface-raised)',
        color: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
      };
    default:
      return {
        background: 'var(--color-surface-raised)',
        color: 'var(--color-muted)',
        border: 'none',
      };
  }
}

function getWorkOrderStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'open':
      return { background: 'var(--color-surface-raised)', color: 'var(--color-on-surface-raised)' };
    case 'in_progress':
      return { background: 'var(--color-warning-light)', color: 'var(--color-ink)' };
    case 'closed':
      return { background: 'var(--color-success-light)', color: 'var(--color-ink)' };
    case 'cancelled':
      return { background: 'var(--color-surface-raised)', color: 'var(--color-muted)' };
    default:
      return { background: 'var(--color-surface-raised)', color: 'var(--color-muted)' };
  }
}

function getWorkOrderStatusLabel(status: string): string {
  switch (status) {
    case 'open': return 'Open';
    case 'in_progress': return 'In progress';
    case 'closed': return 'Closed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function getReadingSourceLabel(source: string): string {
  switch (source) {
    case 'telematics': return 'Telematics';
    case 'telematics_mock': return 'Telematics';
    case 'manual': return 'Manual';
    default: return source;
  }
}

function getReadingSourceBadgeStyle(source: string): React.CSSProperties {
  if (source === 'telematics' || source === 'telematics_mock') {
    return { background: 'var(--color-info-light)', color: 'var(--color-ink)' };
  }
  return { background: 'var(--color-surface-raised)', color: 'var(--color-on-surface-raised)' };
}

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isDueSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 30;
}

function daysUntil(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return 'Due today';
  return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

function kmRemaining(currentKm: number | null | undefined, nextKm: number | null | undefined): string {
  if (currentKm == null || nextKm == null) return '—';
  const rem = nextKm - currentKm;
  if (rem < 0) return `${formatOdometer(Math.abs(rem))} km overdue`;
  return `${formatOdometer(rem)} km remaining`;
}

const SkeletonBlock: React.FC<{ width?: string; height?: string }> = ({ width = '100%', height = '16px' }) => (
  <div
    aria-hidden="true"
    style={{
      width,
      height,
      borderRadius: 'var(--radius-xs)',
      background: 'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }}
  />
);

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccess } = usePermission();

  const canEditVehicle = canAccess(['administrator', 'manager']);
  const canRecordOdometer = canAccess(['administrator', 'manager']);
  const canRaiseWorkOrder = canAccess(['administrator', 'manager']);

  const vehicleId = id ?? '';

  const { vehicle, loading: vehicleLoading, error: vehicleError } = useVehicleDetail(vehicleId);

  const { readings, loading: readingsLoading } = useReadings({
    vehicleId,
    page: 1,
    page_size: 5,
  });

  const { workOrders, loading: workOrdersLoading } = useWorkOrders({
    vehicleId,
    status: 'open',
    page: 1,
    page_size: 20,
  });

  const openWorkOrders = useMemo(
    () => workOrders.filter((wo) => wo.status === 'open' || wo.status === 'in_progress'),
    [workOrders],
  );

  const isLoading = vehicleLoading;

  // Error state
  if (!isLoading && vehicleError) {
    const is404 =
      typeof vehicleError === 'object' &&
      vehicleError !== null &&
      'status' in vehicleError &&
      (vehicleError as { status: number }).status === 404;

    return (
      <div className={styles.page}>
        <div
          role="alert"
          style={{
            background: 'var(--color-error)',
            color: 'var(--color-on-error)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)' }}>
              {is404
                ? 'This vehicle does not exist.'
                : 'Vehicle record could not be loaded.'}
            </span>
          </div>
          <Link
            to="/vehicles"
            style={{
              color: 'var(--color-on-error)',
              fontSize: 'var(--font-size-small)',
              textDecoration: 'underline',
            }}
          >
            ← Back to Vehicles
          </Link>
        </div>
      </div>
    );
  }

  const statusBadgeStyle = vehicle ? getStatusBadgeStyle(vehicle.status) : {};

  return (
    <div className={styles.page}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Page header breadcrumb */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-h1)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/vehicles')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-1) var(--space-2)',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          ← Vehicles
        </button>
        <span style={{ color: 'var(--color-ink)' }}>/</span>
        {isLoading ? (
          <SkeletonBlock width="120px" height="28px" />
        ) : (
          <span>{vehicle?.registration_number ?? '—'}</span>
        )}
      </h1>

      {/* Status row + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {isLoading ? (
            <SkeletonBlock width="64px" height="22px" />
          ) : vehicle ? (
            <span
              style={{
                ...statusBadgeStyle,
                display: 'inline-block',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                textTransform: 'capitalize',
              }}
            >
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </span>
          ) : null}
          {!isLoading && vehicle && (
            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-muted)' }}>
              Last updated {formatDateTime(vehicle.updated_at)}
            </span>
          )}
        </div>

        {!isLoading && vehicle && canEditVehicle && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate(`/vehicles/${vehicleId}/edit`)}
              style={{
                fontSize: 'var(--font-size-small)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              Edit vehicle
            </button>
          </div>
        )}
      </div>

      {/* Two-column cards: Vehicle Info + Service Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-5)',
          marginBottom: 'var(--space-5)',
        }}
        className={styles.cardGrid}
      >
        {/* Vehicle Info Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-h3)',
              fontWeight: 'var(--font-weight-h3)',
              color: 'var(--color-ink)',
              margin: '0 0 var(--space-4) 0',
            }}
          >
            Vehicle information
          </h2>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBlock key={i} height="20px" />
              ))}
            </div>
          ) : vehicle ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-on-surface)' }}>
              <tbody>
                {[
                  {
                    label: 'Registration',
                    value: (
                      <span
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        {vehicle.registration_number}
                      </span>
                    ),
                  },
                  { label: 'Make', value: vehicle.make },
                  { label: 'Model', value: vehicle.model },
                  { label: 'Vehicle type', value: vehicle.vehicle_type_id },
                  { label: 'Depot', value: vehicle.depot_id },
                  { label: 'In service date', value: formatDate(vehicle.in_service_date) },
                  {
                    label: 'Status',
                    value: (
                      <span
                        style={{
                          ...getStatusBadgeStyle(vehicle.status),
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-caption)',
                          fontWeight: 'var(--font-weight-semibold)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </span>
                    ),
                  },
                  {
                    label: 'Telematics',
                    value: (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-body)',
                        }}
                      >
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: 'var(--radius-full)',
                            background: vehicle.has_telematics
                              ? 'var(--color-success)'
                              : 'var(--color-disabled)',
                            display: 'inline-block',
                          }}
                        />
                        {vehicle.has_telematics ? 'Fitted' : 'Not fitted'}
                      </span>
                    ),
                  },
                ].map(({ label, value }, idx, arr) => (
                  <tr
                    key={label}
                    style={{
                      borderBottom:
                        idx < arr.length - 1
                          ? '1px solid var(--color-border-subtle)'
                          : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--space-2) var(--space-3) var(--space-2) 0',
                        color: 'var(--color-muted)',
                        fontSize: 'var(--font-size-small)',
                        whiteSpace: 'nowrap',
                        width: '45%',
                        verticalAlign: 'middle',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-2) 0',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-body)',
                        verticalAlign: 'middle',
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {/* Service Status Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-4)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: 'var(--font-weight-h3)',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Service status
            </h2>
            {!isLoading && canRecordOdometer && (
              <button
                type="button"
                onClick={() => navigate(`/vehicles/${vehicleId}/readings/new`)}
                style={{
                  fontSize: 'var(--font-size-small)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                Record odometer
              </button>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <SkeletonBlock height="80px" />
              <SkeletonBlock height="100px" />
            </div>
          ) : vehicle ? (
            <>
              {/* Current Odometer */}
              <div
                style={{
                  background: 'var(--color-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-on-canvas)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Last known odometer
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-h1)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-family-mono)',
                  }}
                >
                  {vehicle.last_known_odometer_km != null
                    ? `${formatOdometer(vehicle.last_known_odometer_km)} km`
                    : '— km'}
                </div>
                {vehicle.last_odometer_recorded_at && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Recorded {formatDate(vehicle.last_odometer_recorded_at)}
                  </div>
                )}
              </div>

              {/* Next Service Due */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Next service due
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                  }}
                >
                  {/* By date */}
                  {(() => {
                    const dueDate = vehicle.next_service_due_date;
                    const overdue = isOverdue(dueDate);
                    const dueSoon = isDueSoon(dueDate);
                    const borderColor = overdue
                      ? 'var(--color-error)'
                      : dueSoon
                      ? 'var(--color-warning)'
                      : 'var(--color-border)';
                    const bgColor = overdue
                      ? 'var(--color-error-light)'
                      : dueSoon
                      ? 'var(--color-warning-light)'
                      : 'var(--color-surface-raised)';
                    return (
                      <div
                        style={{
                          flex: 1,
                          background: bgColor,
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3)',
                          borderLeft: `3px solid ${borderColor}`,
                          color: 'var(--color-ink)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          {(overdue || dueSoon) && (
                            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-ink)' }}>
                              {overdue ? '⚠' : '⚠'}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 'var(--font-size-caption)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            By date
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-small)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-ink)',
                          }}
                        >
                          {dueDate ? formatDate(dueDate) : '—'}
                        </div>
                        {dueDate && (
                          <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                            {daysUntil(dueDate)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* By odometer */}
                  {(() => {
                    const nextKm = vehicle.next_service_due_odometer_km;
                    const currentKm = vehicle.last_known_odometer_km;
                    const kmOver =
                      nextKm != null && currentKm != null && currentKm >= nextKm;
                    return (
                      <div
                        style={{
                          flex: 1,
                          background: kmOver ? 'var(--color-error-light)' : 'var(--color-surface-raised)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-3)',
                          borderLeft: `3px solid ${
                            kmOver ? 'var(--color-error)' : 'var(--color-border)'
                          }`,
                          color: 'var(--color-on-surface-raised)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 'var(--font-size-caption)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-ink)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          By odometer
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-small)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-ink)',
                          }}
                        >
                          {nextKm != null ? `${formatOdometer(nextKm)} km` : '—'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                          {kmRemaining(currentKm, nextKm)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Open Work Orders Panel */}
      <div
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
          boxShadow: 'var(--elevation-1)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-5)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: 'var(--font-weight-h3)',
                color: 'var(--color-ink)',
                margin: '0 0 var(--space-1) 0',
              }}
            >
              Open work orders
            </h2>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
              {workOrdersLoading ? '…' : `${openWorkOrders.length} open`} · filtered to this vehicle
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/work-orders')}
              style={{
                fontSize: 'var(--font-size-small)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              View all work orders
            </button>
            {canRaiseWorkOrder && (
              <button
                type="button"
                onClick={() => navigate(`/work-orders/new?vehicleId=${vehicleId}`)}
                style={{
                  fontSize: 'var(--font-size-small)',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                Raise work order
              </button>
            )}
          </div>
        </div>

        {workOrdersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} height="44px" />
            ))}
          </div>
        ) : openWorkOrders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            No open work orders for this vehicle.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '560px',
                color: 'var(--color-on-surface)',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--color-canvas)', color: 'var(--color-on-canvas)' }}>
                  {['Ref', 'Description', 'Raised', 'Status', ''].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: col === '' ? 'right' : 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--font-size-caption)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openWorkOrders.map((wo: WorkOrder, idx: number) => (
                  <tr
                    key={wo.id}
                    style={{
                      borderBottom:
                        idx < openWorkOrders.length - 1
                          ? '1px solid var(--color-border-subtle)'
                          : 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-canvas)';
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '';
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-mono)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {wo.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {wo.description ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDate(wo.raised_at)}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span
                        style={{
                          ...getWorkOrderStatusBadgeStyle(wo.status),
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-caption)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        {getWorkOrderStatusLabel(wo.status)}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/work-orders/${wo.id}`);
                        }}
                        style={{
                          fontSize: 'var(--font-size-small)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          fontFamily: 'var(--font-family-base)',
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Odometer Readings Panel */}
      <div
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
          boxShadow: 'var(--elevation-1)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-5)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: 'var(--font-weight-h3)',
                color: 'var(--color-ink)',
                margin: '0 0 var(--space-1) 0',
              }}
            >
              Odometer readings
            </h2>
            <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
              Most recent 5 entries shown
            </span>
          </div>
          {canRecordOdometer && (
            <button
              type="button"
              onClick={() => navigate(`/vehicles/${vehicleId}/readings/new`)}
              style={{
                fontSize: 'var(--font-size-small)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              Record new reading
            </button>
          )}
        </div>

        {readingsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} height="44px" />
            ))}
          </div>
        ) : readings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            No odometer readings recorded for this vehicle.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '400px',
                color: 'var(--color-on-surface)',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--color-canvas)', color: 'var(--color-on-canvas)' }}>
                  {['Date', 'Reading (km)', 'Source', 'Recorded by'].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        textAlign: i === 1 || i === 3 ? 'right' : 'left',
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--font-size-caption)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map((reading: Reading, idx: number) => (
                  <tr
                    key={reading.id}
                    style={{
                      borderBottom:
                        idx < readings.length - 1
                          ? '1px solid var(--color-border-subtle)'
                          : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {formatDate(reading.reading_timestamp)}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-mono)',
                        textAlign: 'right',
                        color: 'var(--color-ink)',
                        fontWeight: 'var(--font-weight-semibold)',
                      }}
                    >
                      {formatOdometer(reading.odometer_km)}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span
                        style={{
                          ...getReadingSourceBadgeStyle(reading.source),
                          display: 'inline-block',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-caption)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        {getReadingSourceLabel(reading.source)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-muted)',
                        textAlign: 'right',
                      }}
                    >
                      {reading.recorded_by_user_id ? reading.recorded_by_user_id.slice(0, 8) : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDetailPage;
