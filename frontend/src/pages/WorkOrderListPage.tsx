import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/dateUtils';
import type { WorkOrder } from '../types/workOrder';
import styles from './WorkOrderListPage.module.css';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'open' | 'in_progress' | 'closed' | 'cancelled';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function getStatusBadge(status: WorkOrder['status']) {
  switch (status) {
    case 'open':
      return {
        icon: '\uD83D\uDD34',
        label: 'Open',
        badgeClass: 'badge-error',
        rowBg: 'var(--color-surface)',
        rowBgHover: 'var(--color-canvas)',
        opacity: 1,
      };
    case 'in_progress':
      return {
        icon: '\uD83D\uDD35',
        label: 'In Progress',
        badgeClass: 'badge-info',
        rowBg: 'var(--color-info-light)',
        rowBgHover: 'var(--color-teal-40)',
        opacity: 1,
      };
    case 'closed':
      return {
        icon: '\u2705',
        label: 'Closed',
        badgeClass: 'badge-success',
        rowBg: 'var(--color-surface)',
        rowBgHover: 'var(--color-canvas)',
        opacity: 0.8,
      };
    case 'cancelled':
      return {
        icon: '\u26D4',
        label: 'Cancelled',
        badgeClass: '',
        rowBg: 'var(--color-surface)',
        rowBgHover: 'var(--color-canvas)',
        opacity: 0.7,
      };
    default:
      return {
        icon: '',
        label: status,
        badgeClass: '',
        rowBg: 'var(--color-surface)',
        rowBgHover: 'var(--color-canvas)',
        opacity: 1,
      };
  }
}

const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const canCreate = canAccess(['administrator', 'manager']);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [depotFilter, setDepotFilter] = useState('');
  const [page, setPage] = useState(1);

  const { workOrders, pagination, loading, error, refetch } = useWorkOrders({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return workOrders;
    const q = search.trim().toLowerCase();
    return workOrders.filter((wo) => {
      const id = wo.id.toLowerCase();
      return id.includes(q);
    });
  }, [workOrders, search]);

  const totalItems = pagination?.total_items ?? filtered.length;
  const totalPages = pagination?.total_pages ?? 1;

  const handleTabClick = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleRowClick = (id: string) => {
    navigate(`/work-orders/${id}`);
  };

  const renderSkeletonRows = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} aria-hidden="true">
        {Array.from({ length: 6 }).map((__, j) => (
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
                width: j === 0 ? '100px' : '80%',
              }}
            />
          </td>
        ))}
      </tr>
    ));

  const renderStatusBadge = (status: WorkOrder['status']) => {
    const b = getStatusBadge(status);
    const isCancelled = status === 'cancelled';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--font-size-caption)',
          fontWeight: 'var(--font-weight-medium)',
          background: isCancelled ? 'var(--color-warm-grey-60)' : undefined,
          color: isCancelled ? 'var(--color-body)' : 'var(--color-ink)',
        }}
        className={b.badgeClass ? `badge ${b.badgeClass}` : 'badge'}
      >
        <span>{b.icon}</span>
        {b.label}
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
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-muted)', margin: 0 }}>
          Page {page} of {totalPages}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--font-size-small)',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: 'var(--color-body)',
              opacity: page === 1 ? 0.5 : 1,
              fontFamily: 'var(--font-family-base)',
            }}
          >
            \u2190 Previous
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-small)',
                background: p === page ? 'var(--color-primary)' : 'transparent',
                color: p === page ? 'var(--color-on-primary)' : 'var(--color-body)',
                border: p === page ? 'none' : '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight:
                  p === page ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--font-size-small)',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              color: 'var(--color-body)',
              opacity: page === totalPages ? 0.5 : 1,
              fontFamily: 'var(--font-family-base)',
            }}
          >
            Next \u2192
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
        Work Orders
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
          {/* Status filter tabs */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-1)',
              background: 'var(--color-surface-raised)',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              color: 'var(--color-on-surface-raised)',
            }}
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabClick(tab.value)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--font-size-small)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  fontWeight:
                    statusFilter === tab.value
                      ? 'var(--font-weight-semibold)'
                      : 'var(--font-weight-regular)',
                  background:
                    statusFilter === tab.value ? 'var(--color-primary)' : 'transparent',
                  color:
                    statusFilter === tab.value
                      ? 'var(--color-on-primary)'
                      : 'var(--color-body)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Create Work Order CTA */}
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate('/work-orders/new')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>\uFF0B</span>
              Create Work Order
            </button>
          )}
        </div>

        {/* Search row */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ margin: 0, flex: 1, minWidth: '200px', maxWidth: '380px' }}>
            <label
              htmlFor="work-order-list-wo-search"
              style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-muted)', display: 'block', marginBottom: 'var(--space-1)' }}
            >
              Search work orders
            </label>
            <input
              id="work-order-list-wo-search"
              type="search"
              placeholder="Vehicle reg, WO reference, technician\u2026"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
          <div style={{ margin: 0, minWidth: '160px' }}>
            <label
              htmlFor="work-order-list-wo-depot"
              style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-muted)', display: 'block', marginBottom: 'var(--space-1)' }}
            >
              Depot
            </label>
            <select
              id="work-order-list-wo-depot"
              value={depotFilter}
              onChange={(e) => { setDepotFilter(e.target.value); setPage(1); }}
              style={{
                fontSize: 'var(--font-size-small)',
                minWidth: '160px',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
                color: 'var(--color-body)',
                fontFamily: 'var(--font-family-base)',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <option value="">All depots</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-muted)', margin: 0 }}>
            Showing{' '}
            <strong style={{ color: 'var(--color-body)' }}>
              {loading ? '\u2026' : totalItems}
            </strong>{' '}
            work orders
          </p>
        </div>

        {/* Work Order Table */}
        <div
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--elevation-2)',
            background: 'var(--color-surface)',
          }}
        >
          {/* Error banner — column headers remain visible */}
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
              <span style={{ flex: 1 }}>Could not load work orders. Please try again.</span>
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
                minWidth: '680px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-surface-raised)',
                    borderBottom: '2px solid var(--color-border-subtle)',
                    color: 'var(--color-on-surface-raised)',
                  }}
                >
                  {['WO Reference', 'Vehicle', 'Assigned Technician', 'Status', 'Raised', 'Depot'].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: 'var(--space-3) var(--space-4)',
                        fontSize: 'var(--font-size-caption)',
                        fontWeight: 'var(--font-weight-semibold)',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
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
                      colSpan={6}
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
                        <span style={{ fontSize: '48px' }} aria-hidden="true">\uD83D\uDCCB</span>
                        <p
                          style={{
                            fontSize: 'var(--font-size-body)',
                            color: 'var(--color-muted)',
                            margin: 0,
                          }}
                        >
                          No work orders found.
                        </p>
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() => navigate('/work-orders/new')}
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
                            Create Work Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((wo) => {
                    const badge = getStatusBadge(wo.status);
                    const isHighWeight = wo.status === 'open' || wo.status === 'in_progress';
                    const isClosed = wo.status === 'closed';
                    const isCancelled = wo.status === 'cancelled';

                    return (
                      <tr
                        key={wo.id}
                        onClick={() => handleRowClick(wo.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          background: badge.rowBg,
                          color: 'var(--color-ink)',
                          opacity: badge.opacity,
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = badge.rowBgHover;
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = badge.rowBg;
                        }}
                        aria-label={`Work order ${wo.id}`}
                      >
                        {/* WO Reference */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-ink)' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-family-mono)',
                              fontSize: 'var(--font-size-small)',
                              fontWeight: isClosed || isCancelled
                                ? 'var(--font-weight-medium)'
                                : 'var(--font-weight-semibold)',
                              color: isClosed || isCancelled
                                ? 'var(--color-muted)'
                                : 'var(--color-primary)',
                            }}
                          >
                            #{wo.id.slice(0, 12).toUpperCase()}
                          </span>
                        </td>

                        {/* Vehicle */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-ink)' }}>
                          <div
                            style={{
                              fontSize: 'var(--font-size-small)',
                              fontWeight: isHighWeight
                                ? 'var(--font-weight-semibold)'
                                : 'var(--font-weight-regular)',
                              color: 'var(--color-body)',
                            }}
                          >
                            {wo.vehicle_id}
                          </div>
                        </td>

                        {/* Assigned Technician */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-ink)' }}>
                          {wo.assigned_technician_id ? (
                            <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-body)' }}>
                              {wo.assigned_technician_id}
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: 'var(--font-size-small)',
                                color: 'var(--color-muted)',
                                fontStyle: 'italic',
                              }}
                            >
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-ink)' }}>
                          {renderStatusBadge(wo.status)}
                        </td>

                        {/* Raised */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-body)',
                          }}
                        >
                          {formatDate(wo.raised_at)}
                        </td>

                        {/* Depot */}
                        <td
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            fontSize: 'var(--font-size-small)',
                            color: 'var(--color-body)',
                          }}
                        >
                          {wo.depot_id}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && filtered.length > 0 && renderPagination()}

        {/* Status legend */}
        <div
          style={{
            background: 'var(--color-surface-raised)',
            boxShadow: 'none',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            color: 'var(--color-on-surface-raised)',
          }}
        >
          <p
            style={{
              marginBottom: 'var(--space-3)',
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-muted)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--font-letter-spacing-caps)',
              textTransform: 'uppercase',
              margin: '0 0 var(--space-3) 0',
            }}
          >
            STATUS KEY
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', color: 'var(--color-on-surface-raised)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span
                className="badge badge-error"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-on-surface-raised)' }}
              >
                <span>\uD83D\uDD34</span> Open
              </span>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                Raised, awaiting assignment
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span
                className="badge badge-info"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-on-surface-raised)' }}
              >
                <span>\uD83D\uDD35</span> In Progress
              </span>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                Technician assigned and working
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span
                className="badge badge-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-on-surface-raised)' }}
              >
                <span>\u2705</span> Closed
              </span>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                Work completed and signed off
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <span
                className="badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  background: 'var(--color-warm-grey-60)',
                  color: 'var(--color-body)',
                }}
              >
                <span style={{ color: 'var(--color-ink)' }}>\u26D4</span> Cancelled
              </span>
              <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                Order voided before completion
              </span>
            </div>
          </div>
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

export default WorkOrderListPage;
