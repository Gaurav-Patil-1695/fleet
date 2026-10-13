import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyWorkOrders } from '../hooks/useMyWorkOrders';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/dateUtils';
import type { WorkOrder } from '../types/workOrder';
import styles from './MyWorkOrdersPage.module.css';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'closed';

function getBorderColor(status: WorkOrder['status']): string {
  switch (status) {
    case 'in_progress':
      return 'var(--color-info)';
    case 'open':
      return 'var(--color-warning)';
    case 'closed':
    case 'cancelled':
      return 'var(--color-border-subtle)';
    default:
      return 'var(--color-border-subtle)';
  }
}

function getStatusBadgeClass(status: WorkOrder['status']): string {
  switch (status) {
    case 'in_progress':
      return 'badge -info';
    case 'open':
      return 'badge -warning';
    case 'closed':
      return 'badge -success';
    case 'cancelled':
      return 'badge -error';
    default:
      return 'badge';
  }
}

function getStatusLabel(status: WorkOrder['status']): string {
  switch (status) {
    case 'in_progress':
      return '● In Progress';
    case 'open':
      return '○ Open';
    case 'closed':
      return '✓ Closed';
    case 'cancelled':
      return '✕ Cancelled';
    default:
      return status;
  }
}

function isCloseable(status: WorkOrder['status']): boolean {
  return status === 'open' || status === 'in_progress';
}

function isMuted(status: WorkOrder['status']): boolean {
  return status === 'closed' || status === 'cancelled';
}

const SkeletonCard: React.FC = () => (
  <div
    style={{
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface)',
      boxShadow: 'var(--elevation-1)',
      borderLeft: '4px solid var(--color-border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
    aria-hidden="true"
  >
    {[45, 80, 60].map((w, i) => (
      <div
        key={i}
        style={{
          height: '14px',
          borderRadius: 'var(--radius-xs)',
          width: `${w}%`,
          background:
            'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }}
      />
    ))}
  </div>
);

const MyWorkOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const depotName = 'Depot';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { workOrders, pagination, loading, error, refetch } = useMyWorkOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: 1,
    page_size: 50,
  });

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return workOrders;
    return workOrders.filter((wo) => wo.status === statusFilter);
  }, [workOrders, statusFilter]);

  const counts = useMemo(() => ({
    all: workOrders.length,
    open: workOrders.filter((wo) => wo.status === 'open').length,
    in_progress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    closed: workOrders.filter((wo) => wo.status === 'closed').length,
  }), [workOrders]);

  const totalItems = pagination?.total_items ?? workOrders.length;

  const handleCardClick = (id: string) => {
    navigate(`/work-orders/${id}`);
  };

  const handleCloseClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/work-orders/${id}/close`);
  };

  const handleViewClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/work-orders/${id}`);
  };

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-body)',
          marginBottom: 'var(--space-2)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        My Work Orders
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-small)',
          color: 'var(--color-muted)',
          marginBottom: 'var(--space-6)',
          margin: '0 0 var(--space-6) 0',
        }}
      >
        Work orders assigned to you at {depotName}
      </p>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--color-error)',
            color: 'var(--color-on-error)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-small)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1 }}>
            Could not load your work orders. Please try again.
          </span>
          <button
            type="button"
            onClick={refetch}
            style={{
              background: 'var(--color-on-error)',
              color: 'var(--color-error)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-1) var(--space-3)',
              fontSize: 'var(--font-size-caption)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-base)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      {!error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            {filterButtons.map(({ key, label }) => {
              const isActive = statusFilter === key;
              const count = counts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  style={{
                    fontSize: 'var(--font-size-small)',
                    padding: 'var(--space-2) var(--space-4)',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'var(--color-on-primary)' : 'var(--color-body)',
                    border: isActive ? 'none' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family-base)',
                    fontWeight: isActive
                      ? 'var(--font-weight-semibold)'
                      : 'var(--font-weight-regular)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    minHeight: 'var(--touch-target-min)',
                    transition: 'background 0.15s',
                  }}
                >
                  {label}
                  {!loading && (
                    <span
                      style={{
                        background: isActive
                          ? 'var(--color-primary-dark)'
                          : 'var(--color-surface-raised)',
                        color: isActive
                          ? 'var(--color-on-primary-dark)'
                          : 'var(--color-on-surface-raised)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-caption)',
                        padding: '2px 8px',
                        marginLeft: 'var(--space-1)',
                        fontWeight: isActive
                          ? 'var(--font-weight-semibold)'
                          : 'var(--font-weight-regular)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!loading && (
            <p
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {totalItems} order{totalItems !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-16) var(--space-4)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '48px' }} aria-hidden="true">
            📋
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-body)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-body)',
              margin: 0,
            }}
          >
            You have no work orders assigned to you.
          </p>
          <p
            style={{
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-muted)',
              margin: 0,
            }}
          >
            Work orders assigned to you by a manager will appear here.
          </p>
        </div>
      )}

      {/* Work Order Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          {filtered.map((wo) => {
            const muted = isMuted(wo.status);
            const closeable = isCloseable(wo.status);
            const borderColor = getBorderColor(wo.status);

            return (
              <div
                key={wo.id}
                onClick={() => handleCardClick(wo.id)}
                style={{
                  padding: 'var(--space-5)',
                  borderLeft: `4px solid ${borderColor}`,
                  cursor: 'pointer',
                  boxShadow: 'var(--elevation-1)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  opacity: muted ? 0.78 : 1,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    'var(--elevation-2)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    'var(--elevation-1)';
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(wo.id);
                  }
                }}
                aria-label={`Work order ${wo.id}, status ${wo.status}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--space-4)',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left content */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* ID + Status badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: 'var(--font-size-small)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: muted
                            ? 'var(--color-muted)'
                            : 'var(--color-primary)',
                        }}
                      >
                        #{wo.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={getStatusBadgeClass(wo.status)}>
                        {getStatusLabel(wo.status)}
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: 'var(--font-size-body)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: muted ? 'var(--color-muted)' : 'var(--color-ink)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={wo.description ?? ''}
                    >
                      {wo.description ?? '(No description)'}
                    </p>

                    {/* Meta row */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--space-5)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        🚌{' '}
                        <strong
                          style={{
                            color: muted
                              ? 'var(--color-muted)'
                              : 'var(--color-body)',
                          }}
                        >
                          {wo.vehicle_id}
                        </strong>
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        📍 {wo.depot_id}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        📅 Raised {formatDate(wo.raised_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {closeable && (
                      <button
                        type="button"
                        onClick={(e) => handleCloseClick(e, wo.id)}
                        style={{
                          fontSize: 'var(--font-size-small)',
                          padding: 'var(--space-2) var(--space-4)',
                          background: 'var(--color-secondary)',
                          color: 'var(--color-on-secondary)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-family-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          minHeight: 'var(--touch-target-min)',
                        }}
                      >
                        Close Order
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleViewClick(e, wo.id)}
                      style={{
                        fontSize: 'var(--font-size-small)',
                        padding: 'var(--space-2) var(--space-4)',
                        background: 'transparent',
                        color: 'var(--color-body)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family-base)',
                        minHeight: 'var(--touch-target-min)',
                      }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-6)',
            marginTop: 'var(--space-8)',
            paddingTop: 'var(--space-5)',
            borderTop: '1px solid var(--color-border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-warning)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Open — awaiting start
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-info)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              In Progress — work underway
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-border-subtle)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Closed — completed
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--font-size-caption);
          font-weight: var(--font-weight-medium);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .badge.-info {
          background: var(--color-info-light);
          color: var(--color-on-info);
        }
        .badge.-warning {
          background: var(--color-warning-light);
          color: var(--color-on-warning);
        }
        .badge.-success {
          background: var(--color-success-light);
          color: var(--color-on-success);
        }
        .badge.-error {
          background: var(--color-error-light);
          color: var(--color-on-error);
        }
      `}</style>
    </div>
  );
};

export default MyWorkOrdersPage;
