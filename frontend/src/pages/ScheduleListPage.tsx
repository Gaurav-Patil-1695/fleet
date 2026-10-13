import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { usePermission } from '../hooks/usePermission';
import type { Schedule } from '../types/schedule';
import styles from './ScheduleListPage.module.css';

type VehicleClassFilter = '' | 'heavy_truck' | 'light_commercial' | 'other';
type StatusFilter = '' | 'active' | 'inactive';

function getVehicleClassLabel(vehicleClass: Schedule['vehicle_class']): string {
  switch (vehicleClass) {
    case 'heavy_truck':
      return 'Heavy truck';
    case 'light_commercial':
      return 'Light commercial';
    case 'other':
      return 'Other';
    default:
      return vehicleClass;
  }
}

function getVehicleClassBadgeStyle(vehicleClass: Schedule['vehicle_class']): React.CSSProperties {
  switch (vehicleClass) {
    case 'heavy_truck':
      return {
        background: 'var(--color-sky-40)',
        color: 'var(--color-ink)',
      };
    case 'light_commercial':
      return {
        background: 'var(--color-sage-40)',
        color: 'var(--color-ink)',
      };
    case 'other':
    default:
      return {
        background: 'var(--color-warm-grey-40)',
        color: 'var(--color-ink)',
      };
  }
}

function formatKmInterval(km: number): string {
  return km.toLocaleString() + ' km';
}

function formatMonthInterval(months: number): string {
  return months + (months === 1 ? ' month' : ' months');
}

const DotIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
    <circle cx="4" cy="4" r="4" fill={color} />
  </svg>
);

const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const isAdministrator = canAccess(['administrator']);

  const [search, setSearch] = useState('');
  const [vehicleClassFilter, setVehicleClassFilter] = useState<VehicleClassFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedVehicleClass, setAppliedVehicleClass] = useState<VehicleClassFilter>('');
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (appliedVehicleClass) params.vehicle_class = appliedVehicleClass;
    if (appliedStatus === 'active') params.is_active = true;
    if (appliedStatus === 'inactive') params.is_active = false;
    return params;
  }, [appliedVehicleClass, appliedStatus]);

  const { schedules, loading, error, refetch } = useSchedules(queryParams);

  const filtered = useMemo(() => {
    if (!appliedSearch.trim()) return schedules;
    const q = appliedSearch.trim().toLowerCase();
    return schedules.filter((s) => {
      const label = getVehicleClassLabel(s.vehicle_class).toLowerCase();
      return label.includes(q) || s.vehicle_class.toLowerCase().includes(q);
    });
  }, [schedules, appliedSearch]);

  const sortedSchedules = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aLabel = getVehicleClassLabel(a.vehicle_class);
      const bLabel = getVehicleClassLabel(b.vehicle_class);
      return aLabel.localeCompare(bLabel);
    });
  }, [filtered]);

  const totalCount = schedules.length;
  const activeCount = schedules.filter((s) => s.is_active).length;
  const inactiveCount = schedules.filter((s) => !s.is_active).length;
  const vehicleClasses = useMemo(() => {
    const classes = new Set(schedules.map((s) => s.vehicle_class));
    return classes.size;
  }, [schedules]);

  const handleFilter = () => {
    setAppliedSearch(search);
    setAppliedVehicleClass(vehicleClassFilter);
    setAppliedStatus(statusFilter);
  };

  const handleRowClick = (scheduleId: string) => {
    navigate(`/schedules/${scheduleId}`);
  };

  const handleEdit = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    navigate(`/schedules/${scheduleId}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    setDeleteTargetId(scheduleId);
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    // Deletion would call deleteSchedule service; out of scope for this list page.
    // After deletion, refetch.
    setDeleteTargetId(null);
    refetch();
  };

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} aria-hidden="true">
        {Array.from({ length: 6 }).map((__, j) => (
          <td
            key={j}
            style={{
              padding: 'var(--space-3) var(--space-5)',
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
                width: j === 5 ? '80px' : '100%',
              }}
            />
          </td>
        ))}
      </tr>
    ));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: 'var(--space-6)',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h1
            style={{
              color: 'var(--color-ink)',
              margin: 0,
              fontSize: 'var(--font-size-h1)',
              fontWeight: 'var(--font-weight-h1)',
              lineHeight: 'var(--font-line-height-h1)',
              fontFamily: 'var(--font-family-base)',
            }}
          >
            Service Schedules
          </h1>
          <p
            style={{
              margin: 'var(--space-1) 0 0',
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-family-base)',
            }}
          >
            Define service intervals by vehicle type and class
          </p>
        </div>
        {isAdministrator && (
          <button
            type="button"
            onClick={() => navigate('/schedules/new')}
            style={{
              background: 'var(--color-primary-dark)',
              color: 'var(--color-on-primary-dark)',
              minHeight: 'var(--touch-target-min)',
              padding: '0 var(--space-5)',
              fontWeight: 'var(--font-weight-semibold)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-body)',
              fontFamily: 'var(--font-family-base)',
            }}
          >
            + Add Schedule
          </button>
        )}
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Schedules', value: loading ? '…' : totalCount },
          { label: 'Active', value: loading ? '…' : activeCount },
          { label: 'Inactive', value: loading ? '…' : inactiveCount },
          { label: 'Vehicle Classes', value: loading ? '…' : vehicleClasses },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              minWidth: '140px',
              background: 'var(--color-surface)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4) var(--space-5)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-on-surface)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                marginBottom: 'var(--space-1)',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-ink)',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--elevation-1)',
          border: '1px solid var(--color-border-subtle)',
          padding: 'var(--space-4) var(--space-5)',
          color: 'var(--color-on-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          {/* Search */}
          <div style={{ flex: 2, minWidth: '180px', margin: 0 }}>
            <label
              htmlFor="schedule-search"
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-body)',
                display: 'block',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Search vehicle type
            </label>
            <input
              id="schedule-search"
              type="text"
              placeholder="e.g. Volvo FH16…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFilter(); }}
              style={{
                width: '100%',
                minHeight: 'var(--touch-target-min)',
                fontSize: 'var(--font-size-small)',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Vehicle class */}
          <div style={{ flex: 1, minWidth: '160px', margin: 0 }}>
            <label
              htmlFor="schedule-class-filter"
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-body)',
                display: 'block',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Vehicle class
            </label>
            <select
              id="schedule-class-filter"
              value={vehicleClassFilter}
              onChange={(e) => setVehicleClassFilter(e.target.value as VehicleClassFilter)}
              style={{
                width: '100%',
                minHeight: 'var(--touch-target-min)',
                fontSize: 'var(--font-size-small)',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                cursor: 'pointer',
              }}
            >
              <option value="">All classes</option>
              <option value="heavy_truck">Heavy truck</option>
              <option value="light_commercial">Light commercial</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ flex: 1, minWidth: '140px', margin: 0 }}>
            <label
              htmlFor="schedule-status-filter"
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-body)',
                display: 'block',
                marginBottom: 'var(--space-1)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Status
            </label>
            <select
              id="schedule-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                width: '100%',
                minHeight: 'var(--touch-target-min)',
                fontSize: 'var(--font-size-small)',
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
            </select>
          </div>

          <button
            type="button"
            onClick={handleFilter}
            style={{
              minHeight: 'var(--touch-target-min)',
              padding: '0 var(--space-5)',
              whiteSpace: 'nowrap',
              background: 'var(--color-surface-raised)',
              color: 'var(--color-body)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-small)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-base)',
            }}
          >
            Filter
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--color-error)',
            color: 'var(--color-on-error)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <svg
              width="20"
              height="20"
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
            <span style={{ flex: 1, fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-family-base)' }}>
              Unable to load schedules — please try again.
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
          {error && (
            <span style={{ fontSize: 'var(--font-size-small)', opacity: 0.85, fontFamily: 'var(--font-family-base)' }}>
              {typeof error === 'string' ? error : 'An unexpected error occurred.'}
            </span>
          )}
        </div>
      )}

      {/* Schedule Table */}
      {!error && (
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--elevation-1)',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
            color: 'var(--color-on-surface)',
          }}
        >
          {/* Loading state label */}
          {loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-5)',
                borderBottom: '1px solid var(--color-border-subtle)',
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-small)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Loading schedules…</span>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-body)',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-surface-raised)',
                    color: 'var(--color-on-surface-raised)',
                  }}
                >
                  {[
                    { label: 'Vehicle Type', align: 'left' as const },
                    { label: 'Vehicle Class', align: 'left' as const },
                    { label: 'KM Interval', align: 'right' as const },
                    { label: 'Month Interval', align: 'right' as const },
                    { label: 'Status', align: 'center' as const },
                    { label: 'Actions', align: 'right' as const },
                  ].map(({ label, align }) => (
                    <th
                      key={label}
                      style={{
                        textAlign: align,
                        padding: 'var(--space-3) var(--space-5)',
                        fontSize: 'var(--font-size-caption)',
                        fontWeight: 'var(--font-weight-semibold)',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        textTransform: 'uppercase',
                        color: 'var(--color-muted)',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-family-base)',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  renderSkeletonRows()
                ) : sortedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          padding: 'var(--space-12) var(--space-4)',
                          background: 'var(--color-surface)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--elevation-1)',
                          margin: 'var(--space-4)',
                        }}
                      >
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 48 48"
                          fill="none"
                          aria-hidden="true"
                        >
                          <rect x="8" y="12" width="32" height="28" rx="4" stroke="var(--color-border)" strokeWidth="2" fill="none" />
                          <line x1="16" y1="22" x2="32" y2="22" stroke="var(--color-border)" strokeWidth="2" />
                          <line x1="16" y1="28" x2="28" y2="28" stroke="var(--color-border)" strokeWidth="2" />
                          <path d="M30 8L30 16" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
                          <path d="M18 8L18 16" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <h2
                          style={{
                            fontSize: 'var(--font-size-h2)',
                            fontWeight: 'var(--font-weight-h2)',
                            color: 'var(--color-ink)',
                            margin: 0,
                            fontFamily: 'var(--font-family-base)',
                          }}
                        >
                          No schedules defined
                        </h2>
                        <p
                          style={{
                            fontSize: 'var(--font-size-body)',
                            color: 'var(--color-muted)',
                            margin: 0,
                            textAlign: 'center',
                            fontFamily: 'var(--font-family-base)',
                          }}
                        >
                          Create a schedule to define service intervals for a vehicle type.
                        </p>
                        {isAdministrator ? (
                          <button
                            type="button"
                            onClick={() => navigate('/schedules/new')}
                            style={{
                              background: 'var(--color-primary-dark)',
                              color: 'var(--color-on-primary-dark)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: 'var(--space-3) var(--space-6)',
                              fontSize: 'var(--font-size-small)',
                              fontWeight: 'var(--font-weight-semibold)',
                              cursor: 'pointer',
                              minHeight: 'var(--touch-target-min)',
                              fontFamily: 'var(--font-family-base)',
                            }}
                          >
                            + Add Schedule
                          </button>
                        ) : (
                          <p
                            style={{
                              fontSize: 'var(--font-size-small)',
                              color: 'var(--color-muted)',
                              margin: 0,
                              fontFamily: 'var(--font-family-base)',
                            }}
                          >
                            An administrator must configure schedules.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedSchedules.map((schedule) => {
                    const classBadgeStyle = getVehicleClassBadgeStyle(schedule.vehicle_class);
                    const isActive = schedule.is_active;

                    return (
                      <tr
                        key={schedule.id}
                        onClick={() => handleRowClick(schedule.id)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          color: 'var(--color-on-surface)',
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-canvas)';
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                        }}
                      >
                        {/* Vehicle Type */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            minHeight: 'var(--touch-target-min)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'var(--font-weight-semibold)',
                              color: isActive ? 'var(--color-ink)' : 'var(--color-muted)',
                              fontFamily: 'var(--font-family-base)',
                            }}
                          >
                            {schedule.vehicle_type_id}
                          </div>
                          <div
                            style={{
                              fontSize: 'var(--font-size-caption)',
                              color: 'var(--color-muted)',
                              fontFamily: 'var(--font-family-base)',
                            }}
                          >
                            ID #{schedule.id.slice(0, 8).toUpperCase()}
                          </div>
                        </td>

                        {/* Vehicle Class */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              ...classBadgeStyle,
                              fontSize: 'var(--font-size-caption)',
                              fontWeight: 'var(--font-weight-semibold)',
                              borderRadius: 'var(--radius-full)',
                              padding: 'var(--space-1) var(--space-3)',
                              whiteSpace: 'nowrap',
                              fontFamily: 'var(--font-family-base)',
                            }}
                          >
                            {getVehicleClassLabel(schedule.vehicle_class)}
                          </span>
                        </td>

                        {/* KM Interval */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            textAlign: 'right',
                            fontWeight: 'var(--font-weight-medium)',
                            color: isActive ? 'var(--color-ink)' : 'var(--color-muted)',
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: 'var(--font-family-base)',
                          }}
                        >
                          {formatKmInterval(schedule.km_interval)}
                        </td>

                        {/* Month Interval */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            textAlign: 'right',
                            fontWeight: 'var(--font-weight-medium)',
                            color: isActive ? 'var(--color-ink)' : 'var(--color-muted)',
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: 'var(--font-family-base)',
                          }}
                        >
                          {formatMonthInterval(schedule.month_interval)}
                        </td>

                        {/* Status */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            textAlign: 'center',
                          }}
                        >
                          {isActive ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                fontSize: 'var(--font-size-small)',
                                color: 'var(--color-success)',
                                fontFamily: 'var(--font-family-base)',
                              }}
                            >
                              <DotIcon color="var(--color-success)" />
                              Active
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                fontSize: 'var(--font-size-small)',
                                background: 'var(--color-warm-grey-40)',
                                color: 'var(--color-muted)',
                                borderRadius: 'var(--radius-full)',
                                padding: 'var(--space-1) var(--space-3)',
                                fontFamily: 'var(--font-family-base)',
                              }}
                            >
                              <DotIcon color="var(--color-ink)" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-5)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            textAlign: 'right',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: 'var(--space-2)',
                              justifyContent: 'flex-end',
                            }}
                          >
                            {isAdministrator && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleEdit(e, schedule.id)}
                                  style={{
                                    fontSize: 'var(--font-size-caption)',
                                    padding: 'var(--space-1) var(--space-3)',
                                    minHeight: '36px',
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
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteClick(e, schedule.id)}
                                  style={{
                                    fontSize: 'var(--font-size-caption)',
                                    padding: 'var(--space-1) var(--space-3)',
                                    minHeight: '36px',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-xs)',
                                    cursor: 'pointer',
                                    color: 'var(--color-error)',
                                    fontFamily: 'var(--font-family-base)',
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {!isAdministrator && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRowClick(schedule.id); }}
                                style={{
                                  fontSize: 'var(--font-size-caption)',
                                  padding: 'var(--space-1) var(--space-3)',
                                  minHeight: '36px',
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
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTargetId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--elevation-3)',
              padding: 'var(--space-6)',
              maxWidth: '400px',
              width: '100%',
              color: 'var(--color-on-surface)',
            }}
          >
            <h2
              id="delete-modal-title"
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-h2)',
                color: 'var(--color-ink)',
                margin: '0 0 var(--space-3)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Delete Schedule
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-muted)',
                margin: '0 0 var(--space-6)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Are you sure you want to delete this schedule? This action cannot be undone.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={handleDeleteCancel}
                style={{
                  minHeight: 'var(--touch-target-min)',
                  padding: '0 var(--space-4)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-body)',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                style={{
                  minHeight: 'var(--touch-target-min)',
                  padding: '0 var(--space-4)',
                  background: 'var(--color-error)',
                  color: 'var(--color-on-error)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScheduleListPage;
