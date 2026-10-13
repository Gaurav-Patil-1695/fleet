import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getWorkOrder, closeWorkOrder } from '../services/workOrdersService';
import { parseError } from '../utils/errorUtils';
import type { WorkOrder } from '../types/workOrder';
import styles from './CloseWorkOrderPage.module.css';

const CloseWorkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [alreadyClosed, setAlreadyClosed] = useState(false);

  const [completionNotes, setCompletionNotes] = useState('');
  const [postServiceOdometer, setPostServiceOdometer] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{ completion_notes?: string; post_service_odometer_km?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    getWorkOrder(id)
      .then((wo) => {
        setWorkOrder(wo);
        if (wo.status === 'closed' || wo.status === 'cancelled') {
          setAlreadyClosed(true);
        }
      })
      .catch((err: unknown) => {
        const parsed = parseError(err);
        setFetchError(parsed.message ?? 'Work order could not be loaded');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const validate = (): boolean => {
    const errors: { completion_notes?: string; post_service_odometer_km?: string } = {};
    if (!completionNotes.trim()) {
      errors.completion_notes = 'Completion notes are required to close a work order.';
    }
    const odometer = parseFloat(postServiceOdometer);
    if (postServiceOdometer.trim() === '' || isNaN(odometer) || odometer < 0) {
      errors.post_service_odometer_km = 'Post-service odometer reading is required and must be a non-negative number.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!id) return;

    setSubmitting(true);
    try {
      await closeWorkOrder(id, {
        completion_notes: completionNotes.trim(),
        post_service_odometer_km: parseFloat(postServiceOdometer),
      });
      navigate(`/work-orders/${id}`, {
        replace: true,
        state: { toast: { message: 'Work order closed. Service clock reset.', type: 'success' } },
      });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setSubmitError(parsed.message ?? 'Work order could not be closed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} aria-busy="true" aria-label="Loading work order">
      {[120, 220, 80, 160].map((w, i) => (
        <div
          key={i}
          style={{
            height: '20px',
            width: `${w}px`,
            borderRadius: 'var(--radius-xs)',
            background: 'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        maxWidth: 'var(--content-narrow-width)',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/work-orders"
            style={{
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-1) var(--space-2)',
              textDecoration: 'none',
            }}
          >
            Work Orders
          </Link>
          <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>/</span>
          {id && (
            <>
              <Link
                to={`/work-orders/${id}`}
                style={{
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--space-1) var(--space-2)',
                  textDecoration: 'none',
                }}
              >
                {workOrder ? `WO-${workOrder.id.slice(0, 8).toUpperCase()}` : (loading ? '…' : id)}
              </Link>
              <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>/</span>
            </>
          )}
          <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>Close Work Order</span>
        </div>
      </nav>

      {/* Loading state */}
      {loading && renderSkeleton()}

      {/* Fetch error */}
      {!loading && fetchError && (
        <>
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--color-error-light)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ flex: 1 }}>Work order could not be loaded</span>
            <Link to="/work-orders" style={{ color: 'var(--color-error)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}>Back to Work Orders</Link>
          </div>
        </>
      )}

      {/* Already closed / cancelled warning */}
      {!loading && !fetchError && alreadyClosed && workOrder && (
        <>
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--color-warning-light)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ink)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p style={{ margin: '0 0 var(--space-2) 0', fontWeight: 'var(--font-weight-semibold)' }}>This work order is already closed and cannot be modified.</p>
              <Link to={`/work-orders/${id}`} style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}>Back to Work Order</Link>
            </div>
          </div>
        </>
      )}

      {/* Main content — shown once loaded and work order is actionable */}
      {!loading && !fetchError && !alreadyClosed && workOrder && (
        <>
          {/* Page heading */}
          <div>
            <h1
              style={{
                fontSize: 'var(--font-size-h1)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-body)',
                margin: '0 0 var(--space-1) 0',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Close Work Order #{workOrder.id.slice(0, 8).toUpperCase()}
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)', margin: 0 }}>
              Finalise service, record completion notes and post-service odometer reading.
            </p>
          </div>

          {/* Vehicle context card */}
          <div
            style={{
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--elevation-1)',
              color: 'var(--color-on-surface-raised)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <span
                style={{
                  color: 'var(--color-muted)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                Vehicle &amp; Work Order Context
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-caption)',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-info-light)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-info)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {workOrder.status.replace('_', ' ').charAt(0).toUpperCase() + workOrder.status.replace('_', ' ').slice(1)}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 'var(--space-4)',
                color: 'var(--color-on-surface-raised)',
              }}
            >
              <div>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-caps)' }}>Vehicle ID</p>
                <p style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-semibold)', margin: 0, fontFamily: 'var(--font-family-mono)' }}>{workOrder.vehicle_id.slice(0, 8)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-caps)' }}>Depot ID</p>
                <p style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-body)', margin: 0 }}>{workOrder.depot_id.slice(0, 8)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-caps)' }}>Assigned Technician</p>
                <p style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-body)', margin: 0 }}>
                  {workOrder.assigned_technician_id ? workOrder.assigned_technician_id.slice(0, 8) : <span style={{ color: 'var(--color-muted)' }}>Unassigned</span>}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-caps)' }}>Raised At</p>
                <p style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-body)', margin: 0 }}>{new Date(workOrder.raised_at).toLocaleDateString()}</p>
              </div>
            </div>

            {workOrder.description && (
              <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: 'var(--font-letter-spacing-caps)' }}>Work Order Description</p>
                <p style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-body)', margin: 0, lineHeight: 'var(--font-line-height-body)' }}>{workOrder.description}</p>
              </div>
            )}

            {workOrder.post_service_odometer_km != null && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>Pre-service odometer: </span>
                <span style={{ color: 'var(--color-body)', fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'var(--font-family-mono)' }}>
                  {workOrder.post_service_odometer_km.toLocaleString()} km
                </span>
              </div>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-error-light)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-small)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          {/* Closure form card */}
          <form onSubmit={handleSubmit} noValidate>
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--elevation-1)',
                color: 'var(--color-on-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-size-h3)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-body)',
                  margin: '0 0 var(--space-5) 0',
                  paddingBottom: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                Service completion details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* Completion notes */}
                <div>
                  <label
                    htmlFor="close-work-order-completion_notes"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Completion notes
                    <span style={{ color: 'var(--color-error)', marginLeft: 'var(--space-1)' }} aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="close-work-order-completion_notes"
                    name="completion_notes"
                    rows={5}
                    value={completionNotes}
                    onChange={(e) => {
                      setCompletionNotes(e.target.value);
                      if (fieldErrors.completion_notes) {
                        setFieldErrors((prev) => ({ ...prev, completion_notes: undefined }));
                      }
                    }}
                    placeholder="Describe the work completed, parts replaced, any issues found or deferred, and recommendations for the next service\u2026"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'var(--font-family-base)',
                      fontSize: 'var(--font-size-body)',
                      lineHeight: 'var(--font-line-height-body)',
                      padding: 'var(--space-3)',
                      border: fieldErrors.completion_notes
                        ? '1.5px solid var(--color-error)'
                        : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-body)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    aria-describedby="close-work-order-completion_notes-help"
                    aria-invalid={!!fieldErrors.completion_notes}
                  />
                  {fieldErrors.completion_notes ? (
                    <p
                      style={{
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-caption)',
                        margin: 'var(--space-1) 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                      }}
                      role="alert"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {fieldErrors.completion_notes}
                    </p>
                  ) : (
                    <p id="close-work-order-completion_notes-help" style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: 'var(--space-1) 0 0 0' }}>
                      Required. These notes are recorded against the work order and appear on the vehicle's service history.
                    </p>
                  )}
                </div>

                {/* Post-service odometer */}
                <div>
                  <label
                    htmlFor="close-work-order-post_service_odometer_km"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Post-service odometer (km)
                    <span style={{ color: 'var(--color-error)', marginLeft: 'var(--space-1)' }} aria-hidden="true">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '160px', maxWidth: '260px' }}>
                      <input
                        id="close-work-order-post_service_odometer_km"
                        name="post_service_odometer_km"
                        type="number"
                        value={postServiceOdometer}
                        onChange={(e) => {
                          setPostServiceOdometer(e.target.value);
                          if (fieldErrors.post_service_odometer_km) {
                            setFieldErrors((prev) => ({ ...prev, post_service_odometer_km: undefined }));
                          }
                        }}
                        placeholder="e.g. 148 420"
                        min="0"
                        step="1"
                        disabled={submitting}
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          width: '100%',
                          padding: 'var(--space-2) var(--space-3)',
                          border: fieldErrors.post_service_odometer_km
                            ? '1.5px solid var(--color-error)'
                            : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-body)',
                          fontSize: 'var(--font-size-body)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        aria-describedby="close-work-order-post_service_odometer_km-help"
                        aria-invalid={!!fieldErrors.post_service_odometer_km}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--color-info)" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)' }}>Must be \u2265 0 km</span>
                    </div>
                  </div>
                  {fieldErrors.post_service_odometer_km ? (
                    <p
                      style={{
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-caption)',
                        margin: 'var(--space-1) 0 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                      }}
                      role="alert"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {fieldErrors.post_service_odometer_km}
                    </p>
                  ) : (
                    <p id="close-work-order-post_service_odometer_km-help" style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', margin: 'var(--space-1) 0 0 0' }}>
                      Required. This resets the vehicle's service clock and schedules the next service interval.
                    </p>
                  )}
                </div>

                {/* Service clock info callout */}
                <div
                  style={{
                    background: 'var(--color-info-light)',
                    border: '1px solid var(--color-info)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'flex-start',
                    color: 'var(--color-ink)',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--color-on-info)" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <p style={{ color: 'var(--color-on-info)', fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)', margin: '0 0 var(--space-1) 0' }}>Closing this work order will reset the service clock</p>
                    <p style={{ color: 'var(--color-on-info)', fontSize: 'var(--font-size-small)', margin: 0, lineHeight: 'var(--font-line-height-small)' }}>
                      The vehicle's <strong style={{ color: 'var(--color-ink)' }}>last serviced date</strong> and{' '}
                      <strong style={{ color: 'var(--color-ink)' }}>last serviced odometer</strong> will be updated to today's values. The next service due date and odometer target will be automatically recalculated based on the vehicle's service schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
                paddingTop: 'var(--space-2)',
                flexWrap: 'wrap',
                marginTop: 'var(--space-4)',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(`/work-orders/${id}`)}
                disabled={submitting}
                style={{
                  minWidth: '120px',
                  padding: 'var(--space-2) var(--space-5)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-body)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  minHeight: 'var(--touch-target-min)',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  minWidth: '180px',
                  padding: 'var(--space-2) var(--space-5)',
                  background: 'var(--color-secondary-dark)',
                  color: 'var(--color-on-secondary-dark)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  minHeight: 'var(--touch-target-min)',
                  opacity: submitting ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                {submitting ? (
                  'Closing\u2026'
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Close Work Order
                  </>
                )}
              </button>
            </div>

            {/* Required fields note */}
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-caption)', textAlign: 'right', marginTop: 'calc(-1 * var(--space-3))' }}>
              <span style={{ color: 'var(--color-error)' }}>*</span> Required fields
            </p>
          </form>
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default CloseWorkOrderPage;
