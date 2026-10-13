import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { usePermission } from '../hooks/usePermission';
import { updateSchedule, getSchedule } from '../services/schedulesService';
import { parseError } from '../utils/errorUtils';
import { formatDate } from '../utils/dateUtils';
import type { Schedule } from '../types/schedule';
import styles from './EditSchedulePage.module.css';

function vehicleClassLabel(vehicleClass: string): string {
  switch (vehicleClass) {
    case 'heavy_truck':
      return 'Heavy Truck';
    case 'light_commercial':
      return 'Light Commercial';
    case 'other':
      return 'Other';
    default:
      return vehicleClass;
  }
}

const EditSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { canAccess } = usePermission();

  const isAdmin = canAccess(['administrator']);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [vehicleTypeName, setVehicleTypeName] = useState<string>('');

  const [kmInterval, setKmInterval] = useState<string>('');
  const [monthInterval, setMonthInterval] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [loadingFetch, setLoadingFetch] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ km_interval?: string; month_interval?: string }>({
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isAdmin, navigate]);

  const fetchSchedule = async () => {
    if (!id) return;
    setLoadingFetch(true);
    setFetchError(null);
    try {
      const data = await getSchedule(id);
      setSchedule(data);
      setKmInterval(String(data.km_interval));
      setMonthInterval(String(data.month_interval));
      setIsActive(data.is_active);
      // vehicle type name is not returned by schedule; we display type id-based label
      // In a real app we might fetch vehicle type name separately; for now show the id
      setVehicleTypeName(data.vehicle_type_id);
    } catch (err: unknown) {
      const parsed = parseError(err);
      if (parsed.code === '404') {
        navigate('/not-found', { replace: true });
      } else {
        setFetchError('Unable to load schedule for editing — please try again.');
      }
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = (): boolean => {
    const errors: { km_interval?: string; month_interval?: string } = {};
    const km = parseInt(kmInterval, 10);
    const mo = parseInt(monthInterval, 10);

    if (kmInterval.trim() !== '' && (isNaN(km) || km < 1)) {
      errors.km_interval = 'Kilometre interval must be a positive whole number.';
    }
    if (monthInterval.trim() !== '' && (isNaN(mo) || mo < 1)) {
      errors.month_interval = 'Month interval must be a positive whole number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    if (!validate()) return;
    if (!id) return;

    const payload: { km_interval?: number; month_interval?: number; is_active?: boolean } = {};
    if (kmInterval.trim() !== '') payload.km_interval = parseInt(kmInterval, 10);
    if (monthInterval.trim() !== '') payload.month_interval = parseInt(monthInterval, 10);
    payload.is_active = isActive;

    setSaving(true);
    try {
      await updateSchedule(id, payload);
      setSuccessMessage('Schedule updated successfully');
      navigate(`/schedules/${id}`, { replace: false });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setSaveError(parsed.message ?? 'Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.page}>
      {/* Page Title */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-h1)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-1)',
          lineHeight: 'var(--font-line-height-h1)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        Edit Service Schedule
      </h1>

      {schedule && (
        <p
          style={{
            fontSize: 'var(--font-size-h2)',
            fontWeight: 'var(--font-weight-h2)',
            color: 'var(--color-muted)',
            marginBottom: 'var(--space-6)',
            lineHeight: 'var(--font-line-height-h2)',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          {vehicleTypeName} — {vehicleClassLabel(schedule.vehicle_class)}
        </p>
      )}

      <div
        style={{
          maxWidth: 'var(--content-narrow-width)',
        }}
      >
        {/* Breadcrumb */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-muted)',
            marginBottom: 'var(--space-6)',
          }}
          aria-label="Breadcrumb"
        >
          <span
            onClick={() => navigate('/schedules')}
            style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/schedules'); }}
          >
            Schedules
          </span>
          <span style={{ color: 'var(--color-ink)' }}>›</span>
          {id && (
            <>
              <span
                onClick={() => navigate(`/schedules/${id}`)}
                style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/schedules/${id}`); }}
              >
                {id}
              </span>
              <span style={{ color: 'var(--color-ink)' }}>›</span>
            </>
          )}
          <span style={{ color: 'var(--color-muted)' }}>Edit</span>
        </nav>

        {/* Fetch error */}
        {fetchError && (
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
              marginBottom: 'var(--space-6)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-small)',
              fontFamily: 'var(--font-family-base)',
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
            <span style={{ flex: 1 }}>{fetchError}</span>
            <button
              type="button"
              onClick={fetchSchedule}
              style={{
                background: 'var(--color-error)',
                color: 'var(--color-on-error)',
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

        {/* Form Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--elevation-2)',
          }}
        >
          {/* Save error banner */}
          {saveError && (
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
                marginBottom: 'var(--space-6)',
                color: 'var(--color-error)',
                fontSize: 'var(--font-size-small)',
                fontFamily: 'var(--font-family-base)',
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
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Section: Vehicle Identity (read-only) */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <p
                style={{
                  marginBottom: 'var(--space-4)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Vehicle Identity
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Vehicle Type (read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-muted)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Vehicle type
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-canvas)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      minHeight: 'var(--touch-target-min)',
                    }}
                  >
                    {loadingFetch ? (
                      <div
                        style={{
                          height: '16px',
                          width: '60%',
                          borderRadius: 'var(--radius-xs)',
                          background:
                            'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s infinite',
                        }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-body)',
                          color: 'var(--color-ink)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-family-base)',
                        }}
                      >
                        {vehicleTypeName}
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-muted)',
                        background: 'var(--color-surface-raised)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-family-base)',
                      }}
                    >
                      Read-only
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      lineHeight: 'var(--font-line-height-caption)',
                      margin: 0,
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Changing vehicle type would alter the schedule's identity. Create a new schedule instead.
                  </p>
                </div>

                {/* Vehicle Class (read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-muted)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Vehicle class
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-canvas)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      minHeight: 'var(--touch-target-min)',
                    }}
                  >
                    {loadingFetch ? (
                      <div
                        style={{
                          height: '16px',
                          width: '40%',
                          borderRadius: 'var(--radius-xs)',
                          background:
                            'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s infinite',
                        }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-body)',
                          color: 'var(--color-ink)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-family-base)',
                        }}
                      >
                        {schedule ? vehicleClassLabel(schedule.vehicle_class) : ''}
                      </span>
                    )}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-muted)',
                        background: 'var(--color-surface-raised)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: 'var(--font-family-base)',
                      }}
                    >
                      Read-only
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      lineHeight: 'var(--font-line-height-caption)',
                      margin: 0,
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Derived from the vehicle type classification.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-8)',
              }}
            />

            {/* Section: Service Intervals */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <p
                style={{
                  marginBottom: 'var(--space-4)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Service intervals
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                }}
              >
                {/* KM Interval */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <label
                    htmlFor="edit-schedule-km_interval"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-body)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    KM interval
                  </label>
                  <div style={{ position: 'relative' }}>
                    {loadingFetch ? (
                      <div
                        style={{
                          height: 'var(--touch-target-min)',
                          borderRadius: 'var(--radius-sm)',
                          background:
                            'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s infinite',
                        }}
                        aria-hidden="true"
                      />
                    ) : (
                      <input
                        type="number"
                        id="edit-schedule-km_interval"
                        name="km_interval"
                        value={kmInterval}
                        onChange={(e) => setKmInterval(e.target.value)}
                        min={1}
                        disabled={saving || loadingFetch}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          paddingRight: 'var(--space-10)',
                          padding: 'var(--space-3) var(--space-10) var(--space-3) var(--space-4)',
                          fontSize: 'var(--font-size-body)',
                          fontFamily: 'var(--font-family-base)',
                          border:
                            fieldErrors.km_interval
                              ? '1px solid var(--color-error)'
                              : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-body)',
                          minHeight: 'var(--touch-target-min)',
                          outline: 'none',
                        }}
                        aria-describedby="edit-schedule-km_interval-hint"
                      />
                    )}
                    {!loadingFetch && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 'var(--space-3)',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                          pointerEvents: 'none',
                          fontFamily: 'var(--font-family-base)',
                        }}
                        aria-hidden="true"
                      >
                        km
                      </span>
                    )}
                  </div>
                  {fieldErrors.km_interval && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        lineHeight: 'var(--font-line-height-caption)',
                        margin: 0,
                        fontFamily: 'var(--font-family-base)',
                      }}
                      role="alert"
                    >
                      {fieldErrors.km_interval}
                    </p>
                  )}
                  <p
                    id="edit-schedule-km_interval-hint"
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                      lineHeight: 'var(--font-line-height-caption)',
                      margin: 0,
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Service is triggered when odometer exceeds this distance since last service.
                  </p>
                </div>

                {/* Month Interval */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <label
                    htmlFor="edit-schedule-month_interval"
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-body)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Month interval
                  </label>
                  <div style={{ position: 'relative' }}>
                    {loadingFetch ? (
                      <div
                        style={{
                          height: 'var(--touch-target-min)',
                          borderRadius: 'var(--radius-sm)',
                          background:
                            'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.4s infinite',
                        }}
                        aria-hidden="true"
                      />
                    ) : (
                      <input
                        type="number"
                        id="edit-schedule-month_interval"
                        name="month_interval"
                        value={monthInterval}
                        onChange={(e) => setMonthInterval(e.target.value)}
                        min={1}
                        disabled={saving || loadingFetch}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: 'var(--space-3) var(--space-12) var(--space-3) var(--space-4)',
                          fontSize: 'var(--font-size-body)',
                          fontFamily: 'var(--font-family-base)',
                          border:
                            fieldErrors.month_interval
                              ? '1px solid var(--color-error)'
                              : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-body)',
                          minHeight: 'var(--touch-target-min)',
                          outline: 'none',
                        }}
                        aria-describedby="edit-schedule-month_interval-hint"
                      />
                    )}
                    {!loadingFetch && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 'var(--space-3)',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                          pointerEvents: 'none',
                          fontFamily: 'var(--font-family-base)',
                        }}
                        aria-hidden="true"
                      >
                        months
                      </span>
                    )}
                  </div>
                  {fieldErrors.month_interval && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        lineHeight: 'var(--font-line-height-caption)',
                        margin: 0,
                        fontFamily: 'var(--font-family-base)',
                      }}
                      role="alert"
                    >
                      {fieldErrors.month_interval}
                    </p>
                  )}
                  <p
                    id="edit-schedule-month_interval-hint"
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                      lineHeight: 'var(--font-line-height-caption)',
                      margin: 0,
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Service is triggered when this duration elapses since last service date.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border-subtle)',
                marginBottom: 'var(--space-8)',
              }}
            />

            {/* Section: Schedule Status */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <p
                style={{
                  marginBottom: 'var(--space-4)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Schedule status
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {/* Toggle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexShrink: 0,
                  }}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    id="edit-schedule-is_active"
                    onClick={() => setIsActive((prev) => !prev)}
                    disabled={saving || loadingFetch}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '48px',
                      height: '26px',
                      cursor: saving || loadingFetch ? 'not-allowed' : 'pointer',
                      background: isActive ? 'var(--color-success)' : 'var(--color-disabled)',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      transition: 'background 0.2s',
                      outline: 'none',
                      padding: 0,
                    }}
                    aria-label="Active status"
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: isActive ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        background: 'var(--color-white)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'left 0.2s',
                        boxShadow: 'var(--elevation-1)',
                        display: 'block',
                      }}
                    />
                  </button>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p
                    style={{
                      fontSize: 'var(--font-size-body)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-ink)',
                      marginBottom: 'var(--space-1)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Mark this schedule as active
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-muted)',
                      lineHeight: 'var(--font-line-height-small)',
                      margin: 0,
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Only one schedule can be active per vehicle type at a time. Activating this schedule will require deactivating any conflicting schedule first. Deactivating will stop this schedule from triggering new service events.
                  </p>
                </div>
              </div>
            </div>

            {/* Current record info */}
            {schedule && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-6)',
                  padding: 'var(--space-4) var(--space-5)',
                  background: 'var(--color-info-light)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--space-8)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Schedule ID
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-family-mono)',
                    }}
                  >
                    {schedule.id}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Created
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    {formatDate(schedule.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Last updated
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    {formatDate(schedule.updated_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Status
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      alignSelf: 'flex-start',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      background: schedule.is_active
                        ? 'var(--color-success-light)'
                        : 'var(--color-surface-raised)',
                      color: 'var(--color-ink)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                disabled={saving || loadingFetch}
                style={{
                  background: 'var(--color-primary-dark)',
                  color: 'var(--color-on-primary-dark)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  minHeight: 'var(--touch-target-min)',
                  padding: '0 var(--space-6)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontSize: 'var(--font-size-body)',
                  cursor: saving || loadingFetch ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  opacity: saving || loadingFetch ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                {saving ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid var(--color-on-primary-dark)',
                        borderTopColor: 'transparent',
                        borderRadius: 'var(--radius-full)',
                        animation: 'spin 0.7s linear infinite',
                      }}
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/schedules/${id}`)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  color: 'var(--color-body)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  minHeight: 'var(--touch-target-min)',
                  padding: '0 var(--space-5)',
                  fontSize: 'var(--font-size-body)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading overlay label */}
      {loadingFetch && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-6)',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            fontFamily: 'var(--font-family-base)',
          }}
          aria-live="polite"
        >
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '2px solid var(--color-muted)',
              borderTopColor: 'transparent',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 0.7s linear infinite',
            }}
            aria-hidden="true"
          />
          Loading schedule…
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditSchedulePage;
