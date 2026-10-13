import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { assignWorkOrder } from '../services/workOrdersService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { parseError } from '../utils/errorUtils';
import { WorkOrderStatusBadge } from '../components/workOrder/WorkOrderStatusBadge';
import styles from './WorkOrderDetailPage.module.css';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const WorkOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { canAccess } = usePermission();

  const isManagerOrAdmin = canAccess(['administrator', 'manager']);
  const isTechnician = canAccess(['technician']);

  const { workOrders, loading, error } = useWorkOrders();

  const workOrder = workOrders.find((wo) => wo.id === id);
  const notFound = !loading && !error && !workOrder;

  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const isClosed = workOrder?.status === 'closed' || workOrder?.status === 'cancelled';

  const isAssignedTechnician =
    isTechnician && user?.id !== undefined && workOrder?.assigned_technician_id === user.id;

  const canClose =
    workOrder &&
    !isClosed &&
    (isManagerOrAdmin || isAssignedTechnician);

  const canDelete = isManagerOrAdmin && workOrder && !isClosed;

  const canReassign = isManagerOrAdmin && workOrder && !isClosed;

  const handleAssign = async () => {
    if (!id) return;
    setAssignError(null);

    if (!selectedTechnicianId) {
      setAssignError('Technician ID must be a valid UUID.');
      return;
    }
    if (!UUID_PATTERN.test(selectedTechnicianId)) {
      setAssignError('Technician ID must be a valid UUID.');
      return;
    }

    setAssigning(true);
    try {
      await assignWorkOrder(id, { assigned_technician_id: selectedTechnicianId });
      setAssignSuccess(true);
      setSelectedTechnicianId('');
    } catch (err: unknown) {
      const parsed = parseError(err);
      setAssignError(parsed.message ?? 'Failed to assign technician.');
    } finally {
      setAssigning(false);
    }
  };

  const renderSkeleton = () => (
    <div className={styles.skeletonWrapper} aria-busy="true" aria-label="Loading work order">
      {/* Header skeleton */}
      <div className={styles.skeletonHeaderCard}>
        <div className={styles.skeletonBlock} style={{ width: '30%', height: '14px' }} />
        <div className={styles.skeletonBlock} style={{ width: '50%', height: '32px', marginTop: 'var(--space-2)' }} />
        <div className={styles.skeletonBlock} style={{ width: '40%', height: '14px', marginTop: 'var(--space-2)' }} />
      </div>
      {/* Two column skeleton */}
      <div className={styles.twoCol}>
        <div className={styles.leftCol}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonBlock} style={{ width: '30%', height: '12px' }} />
              <div className={styles.skeletonBlock} style={{ width: '90%', height: '16px', marginTop: 'var(--space-3)' }} />
              <div className={styles.skeletonBlock} style={{ width: '70%', height: '16px', marginTop: 'var(--space-2)' }} />
            </div>
          ))}
        </div>
        <div className={styles.rightCol}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonBlock} style={{ width: '40%', height: '12px' }} />
              <div className={styles.skeletonBlock} style={{ width: '80%', height: '16px', marginTop: 'var(--space-3)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderError = (message: string) => (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-5)',
        background: 'var(--color-error)',
        color: 'var(--color-on-error)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-body)',
        flexWrap: 'wrap',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={() => navigate('/work-orders')}
        style={{
          background: 'var(--color-on-error)',
          color: 'var(--color-error)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-2) var(--space-4)',
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        Back to Work Orders
      </button>
    </div>
  );

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <h1 className={styles.pageTitle}>Work Order Detail</h1>

      {/* Breadcrumb / back nav */}
      <div className={styles.breadcrumbRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/work-orders')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back to Work Orders
        </button>
        {workOrder && (
          <span className={styles.breadcrumbRef}>
            / WO-{workOrder.id.slice(-8).toUpperCase()}
          </span>
        )}
      </div>

      {loading && renderSkeleton()}

      {!loading && error && renderError('Work order could not be loaded.')}

      {!loading && !error && notFound && renderError('This work order does not exist.')}

      {!loading && !error && workOrder && (
        <div className={styles.stack}>
          {/* Header Summary Card */}
          <div className={styles.headerCard}>
            <div className={styles.headerCardInner}>
              <div className={styles.headerLeft}>
                <div className={styles.refLabel}>Reference</div>
                <div className={styles.refValue}>
                  WO-{workOrder.id.slice(-8).toUpperCase()}
                </div>
                <div className={styles.raisedBy}>
                  Raised {formatDateTime(workOrder.raised_at)}
                  {workOrder.raised_by_user_id && ` by User ${workOrder.raised_by_user_id.slice(0, 8)}`}
                </div>
              </div>
              <div className={styles.headerRight}>
                <WorkOrderStatusBadge status={workOrder.status} />
                {canClose && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => navigate(`/work-orders/${workOrder.id}/close`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Close Work Order
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className={styles.twoCol}>
            {/* Left column */}
            <div className={styles.leftCol}>
              {/* Description card */}
              <div className={styles.card}>
                <div className={styles.sectionLabel}>Description</div>
                <p className={styles.descriptionText}>
                  {workOrder.description ?? <em style={{ color: 'var(--color-muted)' }}>No description provided.</em>}
                </p>
              </div>

              {/* Vehicle card */}
              <div className={styles.card}>
                <div className={styles.sectionLabel}>Vehicle</div>
                <div className={styles.vehicleRow}>
                  <div className={styles.vehicleIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" aria-hidden="true">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className={styles.vehicleInfo}>
                    <div className={styles.vehicleReg}>
                      <Link
                        to={`/vehicles/${workOrder.vehicle_id}`}
                        className={styles.vehicleLink}
                      >
                        {workOrder.vehicle_id.slice(0, 8).toUpperCase()}
                      </Link>
                    </div>
                    <div className={styles.vehicleModel}>
                      Vehicle ID: {workOrder.vehicle_id}
                    </div>
                    <div className={styles.vehicleDepot}>
                      Depot ID: {workOrder.depot_id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion details card */}
              <div className={styles.card}>
                <div className={styles.sectionLabel}>Completion Details</div>
                {isClosed && (workOrder.completion_notes || workOrder.post_service_odometer_km || workOrder.closed_at) ? (
                  <div className={styles.completionDetails}>
                    {workOrder.completion_notes && (
                      <div className={styles.completionRow}>
                        <span className={styles.completionFieldLabel}>Notes</span>
                        <p className={styles.completionNotes}>{workOrder.completion_notes}</p>
                      </div>
                    )}
                    {workOrder.post_service_odometer_km !== undefined && workOrder.post_service_odometer_km !== null && (
                      <div className={styles.completionRow}>
                        <span className={styles.completionFieldLabel}>Post-service odometer</span>
                        <span className={styles.completionValue}>
                          {workOrder.post_service_odometer_km.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {workOrder.closed_by_user_id && (
                      <div className={styles.completionRow}>
                        <span className={styles.completionFieldLabel}>Closed by</span>
                        <span className={styles.completionValue}>
                          User {workOrder.closed_by_user_id.slice(0, 8)}
                        </span>
                      </div>
                    )}
                    {workOrder.closed_at && (
                      <div className={styles.completionRow}>
                        <span className={styles.completionFieldLabel}>Closed at</span>
                        <span className={styles.completionValue}>
                          {formatDateTime(workOrder.closed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.completionPending}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="1.5" aria-hidden="true" style={{ marginBottom: 'var(--space-2)' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className={styles.completionPendingText}>
                      Completion details will appear here once the work order is closed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className={styles.rightCol}>
              {/* Status card */}
              <div className={styles.card}>
                <div className={styles.sectionLabel}>Status</div>
                <div className={styles.statusStack}>
                  <div className={styles.statusRow}>
                    <span className={styles.fieldLabel}>Current status</span>
                    <WorkOrderStatusBadge status={workOrder.status} />
                  </div>
                  <hr className={styles.divider} />
                  <div className={styles.statusRow}>
                    <span className={styles.fieldLabel}>Raised</span>
                    <span className={styles.fieldValue}>{formatDate(workOrder.raised_at)}</span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.fieldLabel}>Raised by</span>
                    <span className={styles.fieldValue}>
                      User {workOrder.raised_by_user_id?.slice(0, 8) ?? '—'}
                    </span>
                  </div>
                  <div className={styles.statusRow}>
                    <span className={styles.fieldLabel}>Depot</span>
                    <span className={styles.fieldValue}>
                      {workOrder.depot_id.slice(0, 8)}
                    </span>
                  </div>
                  {workOrder.closed_at && (
                    <div className={styles.statusRow}>
                      <span className={styles.fieldLabel}>Closed</span>
                      <span className={styles.fieldValue}>{formatDate(workOrder.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment card — only for manager/admin and non-closed orders */}
              {canReassign && (
                <div className={styles.card}>
                  <div className={styles.assignmentHeader}>
                    <div className={styles.sectionLabel} style={{ margin: 0 }}>Assignment</div>
                  </div>

                  {/* Current assignee */}
                  <div className={styles.assigneeRow}>
                    <div className={styles.avatar}>
                      {workOrder.assigned_technician_id
                        ? workOrder.assigned_technician_id.slice(0, 2).toUpperCase()
                        : '?'}
                    </div>
                    <div className={styles.assigneeInfo}>
                      <div className={styles.assigneeName}>
                        {workOrder.assigned_technician_id
                          ? `Technician ${workOrder.assigned_technician_id.slice(0, 8)}`
                          : 'Unassigned'}
                      </div>
                      <div className={styles.assigneeRole}>Technician</div>
                    </div>
                  </div>

                  {/* Reassign form */}
                  <div className={styles.reassignForm}>
                    {assignSuccess && (
                      <div
                        role="status"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--color-success-light)',
                          color: 'var(--color-ink)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-small)',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        Technician assigned successfully.
                      </div>
                    )}
                    {assignError && (
                      <div
                        role="alert"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--color-error-light)',
                          color: 'var(--color-error)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-small)',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        {assignError}
                      </div>
                    )}
                    <div className={styles.field}>
                      <label
                        htmlFor="work-order-detail-assigned_technician_id"
                        className={styles.fieldLabelInput}
                      >
                        Reassign to technician
                      </label>
                      <input
                        id="work-order-detail-assigned_technician_id"
                        name="assigned_technician_id"
                        type="text"
                        className={styles.input}
                        placeholder="Enter technician UUID…"
                        value={selectedTechnicianId}
                        onChange={(e) => {
                          setSelectedTechnicianId(e.target.value);
                          setAssignError(null);
                          setAssignSuccess(false);
                        }}
                        disabled={assigning}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      style={{ width: '100%', marginTop: 'var(--space-2)' }}
                      onClick={handleAssign}
                      disabled={assigning}
                    >
                      {assigning ? 'Assigning…' : 'Confirm Assignment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions card */}
              <div className={styles.card}>
                <div className={styles.sectionLabel}>Actions</div>
                <div className={styles.actionsStack}>
                  {canClose && (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                      onClick={() => navigate(`/work-orders/${workOrder.id}/close`)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Close Work Order
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.btnGhost}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                    onClick={() => navigate(`/vehicles/${workOrder.vehicle_id}`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    View Vehicle
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className={styles.btnGhost}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-error)',
                      }}
                      onClick={() => {
                        /* Delete is out of scope for this build; UI only */
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      Delete Work Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderDetailPage;
