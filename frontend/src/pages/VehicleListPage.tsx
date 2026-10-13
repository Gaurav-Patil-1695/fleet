import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/dateUtils';
import type { Vehicle } from '../types/vehicle';
import styles from './VehicleListPage.module.css';

const PAGE_SIZE = 20;

function getStatusBadge(status: Vehicle['status']) {
  switch (status) {
    case 'active':
      return {
        label: '✔ Active',
        bg: 'var(--color-success-light)',
        color: 'var(--color-ink)',
        border: 'none',
      };
    case 'inactive':
      return {
        label: '⏸ Inactive',
        bg: 'var(--color-warning-light)',
        color: 'var(--color-ink)',
        border: 'none',
      };
    case 'decommissioned':
      return {
        label: '✖ Decommissioned',
        bg: 'var(--color-surface-raised)',
        color: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
      };
    default:
      return {
        label: status,
        bg: 'var(--color-surface-raised)',
        color: 'var(--color-muted)',
        border: 'none',
      };
  }
}

function isOverdue(vehicle: Vehicle): boolean {
  if (!vehicle.next_service_due_date) return false;
  return new Date(vehicle.next_service_due_date) < new Date();
}

const VehicleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAccess } = usePermission();

  const canAddVehicle = canAccess(['administrator', 'manager']);
  const canEdit = canAccess(['administrator', 'manager']);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { vehicles, pagination, loading, error, refetch } = useVehicles({
    status: statusFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  // Client-side search filter (registration, make, model)
  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.trim().toLowerCase();
    return vehicles.filter(
      (v) =>
        v.registration_number.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q),
    );
  }, [vehicles, search]);

  // Summary counters
  const totalVehicles = pagination?.total_items ?? vehicles.length;
  const activeCount = vehicles.filter((v) => v.status === 'active').length;
  const inactiveCount = vehicles.filter((v) => v.status === 'inactive').length;
  const decommissionedCount = vehicles.filter((v) => v.status === 'decommissioned').length;
  const overdueCount = vehicles.filter(isOverdue).length;

  const totalPages = pagination?.total_pages ?? 1;

  const handleRowClick = useCallback(
    (vehicleId: string) => {
      navigate(`/vehicles/${vehicleId}`);
    },
    [navigate],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const renderSkeletonRows = () =>
    Array.from({ length: 7 }).map((_, i) => (
      <tr key={i} aria-hidden="true">
        {Array.from({ length: 8 }).map((__, j) => (
          <td
            key={j}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div
              style={{
                height: '16px',
                borderRadius: 'var(--radius-xs)',
                background:
                  'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
                width: j === 0 ? '80px' : j === 7 ? '60px' : '100%',
              }}
            />
          </td>
        ))}
      </tr>
    ));

  const renderServiceDue = (vehicle: Vehicle) => {
    if (!vehicle.next_service_due_date) {
      return <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)' }}>—</span>;
    }
    const overdue = isOverdue(vehicle);
    if (overdue) {
      return (
        <span
          style={{
            color: 'var(--color-error)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-caption)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          ⚠ {formatDate(vehicle.next_service_due_date)}
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-caption)' }}>
        {formatDate(vehicle.next_service_due_date)}
      </span>
    );
  };

  const renderTelematicsCell = (hasTelematics: boolean) => {
    if (hasTelematics) {
      return (
        <span
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-ink)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          ● Fitted
        </span>
      );
    }
    return (
      <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
        — None
      </span>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--color-border-subtle)',
          background: 'var(--color-surface-raised)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          color: 'var(--color-on-surface-raised)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-on-surface-raised)',
          }}
        >
          Showing {filtered.length} of {totalVehicles} vehicles
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageBtn}
            style={{
              fontSize: 'var(--font-size-caption)',
              padding: 'var(--space-1) var(--space-3)',
              color: 'var(--color-on-surface-raised)',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
            type="button"
          >
            ‹ Previous
          </button>
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                fontSize: 'var(--font-size-caption)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: p === page ? 'none' : '1px solid var(--color-border-subtle)',
                background: p === page ? 'var(--color-primary)' : 'transparent',
                color: p === page ? 'var(--color-on-primary)' : 'var(--color-on-surface-raised)',
                cursor: 'pointer',
                fontWeight: p === page ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              }}
              type="button"
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              fontSize: 'var(--font-size-caption)',
              padding: 'var(--space-1) var(--space-3)',
              color: 'var(--color-on-surface-raised)',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
            type="button"
          >
            Next ›
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-body)',
          marginBottom: 'var(--space-6)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        Vehicle Register
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Search */}
            <div style={{ margin: 0, minWidth: '220px' }}>
              <label htmlFor="vehicle-list-search-reg" style={{ display: 'none' }}>
                Search registration
              </label>
              <input
                id="vehicle-list-search-reg"
                type="search"
                placeholder="🔍  Search registration, make or model…"
                value={search}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-small)',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-body)',
                  fontFamily: 'var(--font-family-base)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filter */}
            <div style={{ margin: 0 }}>
              <label htmlFor="vehicle-list-filter-status" style={{ display: 'none' }}>
                Filter by status
              </label>
              <select
                id="vehicle-list-filter-status"
                value={statusFilter}
                onChange={handleStatusChange}
                style={{
                  fontSize: 'var(--font-size-small)',
                  minWidth: '150px',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-body)',
                  fontFamily: 'var(--font-family-base)',
                  cursor: 'pointer',
                }}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>

          {/* Add Vehicle button */}
          {canAddVehicle && (
            <button
              type="button"
              onClick={() => navigate('/vehicles/new')}
              style={{
                whiteSpace: 'nowrap',
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              ＋ Add Vehicle
            </button>
          )}
        </div>

        {/* Summary counters */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {/* Total */}
          <div
            style={{
              flex: 1,
              minWidth: '140px',
              padding: 'var(--space-4)',
              background: 'var(--color-surface)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
              }}
            >
              {loading ? '…' : totalVehicles}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              Total Vehicles
            </div>
          </div>

          {/* Active */}
          <div
            style={{
              flex: 1,
              minWidth: '140px',
              padding: 'var(--space-4)',
              background: 'var(--color-success-light)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
              }}
            >
              {loading ? '…' : activeCount}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              Active
            </div>
          </div>

          {/* Inactive */}
          <div
            style={{
              flex: 1,
              minWidth: '140px',
              padding: 'var(--space-4)',
              background: 'var(--color-warning-light)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
              }}
            >
              {loading ? '…' : inactiveCount}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              Inactive
            </div>
          </div>

          {/* Decommissioned */}
          <div
            style={{
              flex: 1,
              minWidth: '140px',
              padding: 'var(--space-4)',
              background: 'var(--color-surface-raised)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
              }}
            >
              {loading ? '…' : decommissionedCount}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                marginTop: 'var(--space-1)',
              }}
            >
              Decommissioned
            </div>
          </div>

          {/* Service Overdue */}
          <div
            style={{
              flex: 1,
              minWidth: '140px',
              padding: 'var(--space-4)',
              background: 'var(--color-error-light)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
              }}
            >
              {loading ? '…' : overdueCount}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-ink)',
                marginTop: 'var(--space-1)',
              }}
            >
              Service Overdue
            </div>
          </div>
        </div>

        {/* Vehicle Table */}
        <div
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--elevation-2)',
            background: 'var(--color-surface)',
          }}
        >
          {/* Error banner */}
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
                fontSize: 'var(--font-size-small)',
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
              <span style={{ flex: 1 }}>Could not load vehicle records. Please try again.</span>
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

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-small)',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-primary-dark)',
                    color: 'var(--color-on-primary-dark)',
                  }}
                >
                  {[
                    'Registration',
                    'Make / Model',
                    'Type',
                    'Depot',
                    'Status',
                    'Telematics',
                    'Service Due',
                    'Actions',
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'left',
                        fontWeight: 'var(--font-weight-semibold)',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        fontSize: 'var(--font-size-caption)',
                        whiteSpace: 'nowrap',
                        borderBottom: '2px solid var(--color-primary)',
                        color: 'var(--color-on-primary-dark)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletonRows()
                ) : !error && filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 'var(--space-12) var(--space-4)',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                        }}
                      >
                        <span style={{ fontSize: '48px' }} aria-hidden="true">
                          🚛
                        </span>
                        <p
                          style={{
                            fontSize: 'var(--font-size-body)',
                            color: 'var(--color-muted)',
                            margin: 0,
                          }}
                        >
                          No vehicles are registered in the system.
                        </p>
                        {canAddVehicle && (
                          <button
                            type="button"
                            onClick={() => navigate('/vehicles/new')}
                            style={{
                              background: 'var(--color-primary)',
                              color: 'var(--color-on-primary)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-3) var(--space-6)',
                              fontSize: 'var(--font-size-small)',
                              fontWeight: 'var(--font-weight-semibold)',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-family-base)',
                              minHeight: 'var(--touch-target-min)',
                            }}
                          >
                            ＋ Add Vehicle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((vehicle) => {
                    const overdue = isOverdue(vehicle);
                    const decommissioned = vehicle.status === 'decommissioned';
                    const badge = getStatusBadge(vehicle.status);

                    return (
                      <tr
                        key={vehicle.id}
                        onClick={() => handleRowClick(vehicle.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          transition: 'background 0.15s',
                          opacity: decommissioned ? 0.75 : 1,
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background =
                            'var(--color-canvas)';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = '';
                        }}
                        aria-label={`Vehicle ${vehicle.registration_number}`}
                      >
                        {/* Registration */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontFamily: 'var(--font-family-mono)',
                            color: decommissioned
                              ? 'var(--color-muted)'
                              : 'var(--color-primary)',
                          }}
                        >
                          {vehicle.registration_number}
                        </td>

                        {/* Make / Model */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            color: decommissioned ? 'var(--color-muted)' : 'var(--color-body)',
                          }}
                        >
                          {vehicle.make} {vehicle.model}
                        </td>

                        {/* Type — vehicle_type_id displayed, no name available without join */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            color: 'var(--color-muted)',
                            fontSize: 'var(--font-size-caption)',
                          }}
                        >
                          {/* The Vehicle type name is not returned by the list endpoint;
                              display a dash or the id if needed */}
                          —
                        </td>

                        {/* Depot */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            color: decommissioned ? 'var(--color-muted)' : 'var(--color-body)',
                          }}
                        >
                          —
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              border: badge.border,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 'var(--space-1)',
                              fontSize: 'var(--font-size-caption)',
                              padding: 'var(--space-1) var(--space-2)',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Telematics */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {renderTelematicsCell(vehicle.has_telematics)}
                        </td>

                        {/* Service Due */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {renderServiceDue(vehicle)}
                        </td>

                        {/* Actions */}
                        <td
                          style={{ padding: 'var(--space-3) var(--space-4)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/vehicles/${vehicle.id}`);
                              }}
                              style={{
                                fontSize: 'var(--font-size-caption)',
                                padding: 'var(--space-1) var(--space-2)',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-xs)',
                                cursor: 'pointer',
                                color: 'var(--color-body)',
                                fontFamily: 'var(--font-family-base)',
                              }}
                            >
                              View
                            </button>
                            {canEdit && !decommissioned && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/vehicles/${vehicle.id}/edit`);
                                }}
                                style={{
                                  fontSize: 'var(--font-size-caption)',
                                  padding: 'var(--space-1) var(--space-2)',
                                  background: 'transparent',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-xs)',
                                  cursor: 'pointer',
                                  color: 'var(--color-body)',
                                  fontFamily: 'var(--font-family-base)',
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer with pagination */}
          {!loading && !error && filtered.length > 0 && renderPagination()}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-5)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--font-letter-spacing-caps)',
              color: 'var(--color-muted)',
            }}
          >
            LEGEND:
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: 'var(--color-body)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success)',
              }}
            />
            Active
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: 'var(--color-body)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-warning)',
              }}
            />
            Inactive
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: 'var(--color-body)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-border)',
              }}
            />
            Decommissioned
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: 'var(--color-error)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            ⚠ Service date shown in red = overdue
          </span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default VehicleListPage;
