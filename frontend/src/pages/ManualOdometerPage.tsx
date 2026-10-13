import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVehicleDetail } from '../hooks/useVehicleDetail';
import { useReadings } from '../hooks/useReadings';
import { createReading } from '../services/readingsService';
import { formatDate } from '../utils/dateUtils';
import { formatOdometer } from '../utils/odometerUtils';
import { parseError } from '../utils/errorUtils';
import type { Reading } from '../types/reading';
import styles from './ManualOdometerPage.module.css';

const ManualOdometerPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: vehicleId } = useParams<{ id: string }>();

  const { vehicle, loading: vehicleLoading, error: vehicleError } = useVehicleDetail(vehicleId ?? '');
  const { readings, loading: readingsLoading } = useReadings(vehicleId ?? '', { page: 1, page_size: 5 });

  const [odometerInput, setOdometerInput] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [warningConfirm, setWarningConfirm] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lastOdometer = vehicle?.last_known_odometer_km ?? null;

  const validate = (): { valid: boolean; value?: number } => {
    const trimmed = odometerInput.trim();
    if (!trimmed) {
      setFieldError('A valid odometer reading is required');
      return { valid: false };
    }
    const parsed = Number(trimmed);
    if (isNaN(parsed) || !Number.isFinite(parsed)) {
      setFieldError('A valid odometer reading is required');
      return { valid: false };
    }
    if (parsed < 0) {
      setFieldError('Reading must be greater than or equal to zero.');
      return { valid: false };
    }
    setFieldError(null);
    return { valid: true, value: parsed };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setFieldError(null);

    const { valid, value } = validate();
    if (!valid || value === undefined) return;

    // Warning: submitted value below last known odometer
    if (lastOdometer !== null && value < lastOdometer && !warningConfirm) {
      setShowWarning(true);
      return;
    }

    setSubmitting(true);
    try {
      await createReading({
        vehicle_id: vehicleId ?? '',
        odometer_km: value,
        source: 'manual',
        is_test_mode: false,
        reading_timestamp: new Date().toISOString(),
      });
      navigate(`/vehicles/${vehicleId}`, {
        state: { toast: { message: 'Odometer reading recorded.', type: 'success' } },
      });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setBannerError(parsed.message ?? 'Reading could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmWarning = async () => {
    setWarningConfirm(true);
    setShowWarning(false);
    // Re-trigger submit after confirming
    const trimmed = odometerInput.trim();
    const value = Number(trimmed);
    if (isNaN(value) || value < 0) return;

    setSubmitting(true);
    setBannerError(null);
    try {
      await createReading({
        vehicle_id: vehicleId ?? '',
        odometer_km: value,
        source: 'manual',
        is_test_mode: false,
        reading_timestamp: new Date().toISOString(),
      });
      navigate(`/vehicles/${vehicleId}`, {
        state: { toast: { message: 'Odometer reading recorded.', type: 'success' } },
      });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setBannerError(parsed.message ?? 'Reading could not be saved. Please try again.');
      setWarningConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getSourceLabel = (source: Reading['source']) => {
    switch (source) {
      case 'manual':
        return { label: 'Manual', variant: 'info' };
      case 'telematics':
        return { label: 'Telematics', variant: 'success' };
      case 'telematics_mock':
        return { label: 'Mock', variant: 'warning' };
      default:
        return { label: source, variant: 'info' };
    }
  };

  const nowLabel = (() => {
    const now = new Date();
    return now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  const recentReadings = readings?.data?.slice(0, 5) ?? [];

  return (
    <div className={styles.page}>
      {/* Page title */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Record Odometer Reading
        {vehicle ? ` — ${vehicle.registration_number}` : ''}
      </h1>

      {/* Back link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/vehicles/${vehicleId}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-primary)',
            background: 'transparent',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            fontSize: 'var(--font-size-small)',
            fontFamily: 'var(--font-family-base)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M10 13L5 8l5-5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to vehicle detail
        </button>
      </div>

      {/* Vehicle fetch error */}
      {vehicleError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-5)',
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            color: 'var(--color-body)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-error)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ flex: 1, fontSize: 'var(--font-size-small)', color: 'var(--color-body)' }}>
            Vehicle record could not be loaded
          </span>
          <button
            type="button"
            onClick={() => navigate(`/vehicles/${vehicleId}`)}
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-base)',
              textDecoration: 'underline',
            }}
          >
            Go back
          </button>
        </div>
      )}

      {/* Vehicle Summary Bar */}
      <div
        style={{
          background: 'var(--color-primary-dark)',
          color: 'var(--color-on-primary-dark)',
          padding: 'var(--space-5) var(--space-6)',
          marginBottom: 'var(--space-6)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--elevation-2)',
        }}
      >
        {vehicleLoading ? (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[120, 180, 140, 100].map((w, i) => (
              <div
                key={i}
                aria-hidden="true"
                style={{
                  height: '20px',
                  width: `${w}px`,
                  borderRadius: 'var(--radius-xs)',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                }}
              />
            ))}
          </div>
        ) : vehicle ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
              color: 'var(--color-on-primary-dark)',
            }}
          >
            {/* Icon + Registration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div
                style={{
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-2) var(--space-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-primary)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 9l1.5-4.5h15L21 9M3 9v7a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1V9M3 9h18"
                    stroke="var(--color-on-primary)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="7.5" cy="13" r="1.25" fill="var(--color-on-primary)" />
                  <circle cx="16.5" cy="13" r="1.25" fill="var(--color-on-primary)" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-semibold)',
                    letterSpacing: 'var(--font-letter-spacing-caps)',
                    color: 'var(--color-on-primary-dark)',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Registration
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-h2)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-on-primary-dark)',
                    fontFamily: 'var(--font-family-mono)',
                    letterSpacing: 'var(--font-letter-spacing-wide)',
                  }}
                >
                  {vehicle.registration_number}
                </div>
              </div>
            </div>

            <div
              style={{
                width: '1px',
                height: '40px',
                background: 'var(--color-surface)',
                flexShrink: 0,
              }}
            />

            {/* Make & Model */}
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  color: 'var(--color-on-primary-dark)',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Make &amp; Model
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-body)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-on-primary-dark)',
                }}
              >
                {vehicle.make} {vehicle.model}
              </div>
            </div>

            <div
              style={{
                width: '1px',
                height: '40px',
                background: 'var(--color-surface)',
                flexShrink: 0,
              }}
            />

            {/* Last recorded odometer */}
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  color: 'var(--color-on-primary-dark)',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Last recorded odometer
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-body)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-on-primary-dark)',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                {lastOdometer !== null ? `${formatOdometer(lastOdometer)} km` : '—'}
              </div>
            </div>

            {/* Status badge */}
            <div style={{ marginLeft: 'auto' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  background:
                    vehicle.status === 'active'
                      ? 'var(--color-success-light)'
                      : vehicle.status === 'inactive'
                      ? 'var(--color-warning-light)'
                      : 'var(--color-surface-raised)',
                  color: 'var(--color-ink)',
                }}
              >
                {vehicle.status === 'active'
                  ? 'In service'
                  : vehicle.status === 'inactive'
                  ? 'Inactive'
                  : 'Decommissioned'}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main content area */}
      <div style={{ maxWidth: 'var(--content-narrow-width)' }}>
        {/* Top-of-form error banner */}
        {bannerError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-error-light)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-body)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-error)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 'var(--font-size-small)' }}>Reading could not be saved. Please try again.</span>
          </div>
        )}

        {/* Main Form Card */}
        <div
          style={{
            padding: 'var(--space-8)',
            background: 'var(--color-surface)',
            boxShadow: 'var(--elevation-2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-on-surface)',
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Form heading */}
              <div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-h2)',
                    fontWeight: 'var(--font-weight-h2)',
                    color: 'var(--color-ink)',
                    margin: '0 0 var(--space-1) 0',
                    lineHeight: 'var(--font-line-height-h2)',
                  }}
                >
                  Enter current odometer reading
                </h2>
                <p
                  style={{
                    fontSize: 'var(--font-size-small)',
                    margin: '0',
                    color: 'var(--color-muted)',
                  }}
                >
                  Enter the exact reading shown on the vehicle&apos;s instrument cluster. This reading
                  is recorded with a{' '}
                  <strong style={{ color: 'var(--color-body)' }}>manual</strong> source tag.
                </p>
              </div>

              {/* Reference info strip */}
              {vehicle && (
                <div
                  style={{
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4) var(--space-5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    color: 'var(--color-on-canvas)',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, color: 'var(--color-ink)' }}
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                    <path
                      d="M12 11v5M12 8h.01"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-body)' }}>
                    Last recorded value:{' '}
                    <strong style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-ink)' }}>
                      {lastOdometer !== null ? `${formatOdometer(lastOdometer)} km` : '—'}
                    </strong>
                    {vehicle.last_odometer_recorded_at ? (
                      <>
                        {' '}— recorded on{' '}
                        <strong style={{ color: 'var(--color-ink)' }}>
                          {formatDate(vehicle.last_odometer_recorded_at)}
                        </strong>
                      </>
                    ) : null}
                  </span>
                </div>
              )}

              {/* Odometer input */}
              <div>
                <label
                  htmlFor="manual-odometer-entry-odometer-reading"
                  style={{
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-ink)',
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Current odometer reading{' '}
                  <span style={{ color: 'var(--color-ink)' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    maxWidth: '320px',
                    border: fieldError
                      ? '1.5px solid var(--color-error)'
                      : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--elevation-1)',
                  }}
                >
                  <input
                    id="manual-odometer-entry-odometer-reading"
                    type="number"
                    min="0"
                    placeholder="e.g. 143 500"
                    value={odometerInput}
                    onChange={(e) => {
                      setOdometerInput(e.target.value);
                      setFieldError(null);
                      setShowWarning(false);
                      setWarningConfirm(false);
                    }}
                    disabled={submitting}
                    style={{
                      border: 'none',
                      borderRadius: '0',
                      flex: 1,
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--font-size-h3)',
                      fontWeight: 'var(--font-weight-semibold)',
                      letterSpacing: 'var(--font-letter-spacing-wide)',
                      color: 'var(--color-ink)',
                      background: 'transparent',
                      outline: 'none',
                      padding: 'var(--space-4)',
                    }}
                  />
                  <div
                    style={{
                      background: 'var(--color-canvas)',
                      borderLeft: '1px solid var(--color-border-subtle)',
                      padding: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-small)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-muted)',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        textTransform: 'uppercase',
                      }}
                    >
                      km
                    </span>
                  </div>
                </div>

                {/* Field-level error */}
                {fieldError && (
                  <p
                    role="alert"
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-error)',
                      margin: 'var(--space-2) 0 0 0',
                    }}
                  >
                    {fieldError}
                  </p>
                )}

                {!fieldError && (
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      margin: 'var(--space-2) 0 0 0',
                    }}
                  >
                    Enter whole kilometres. Do not include decimal points or units.
                  </p>
                )}
              </div>

              {/* Timestamp hint */}
              <div
                style={{
                  background: 'var(--color-info-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  color: 'var(--color-ink)',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ flexShrink: 0, color: 'var(--color-on-info)' }}
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.75" />
                  <path
                    d="M3 9h18M8 2v4M16 2v4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-on-info)' }}>
                  Reading timestamp will be set to{' '}
                  <strong style={{ color: 'var(--color-ink)' }}>now</strong> — {nowLabel}
                </span>
              </div>

              {/* Warning: value below last known odometer */}
              {showWarning && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--color-warning-light)',
                    border: '1px solid var(--color-warning)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4) var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    color: 'var(--color-ink)',
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
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0, color: 'var(--color-warning)' }}
                    >
                      <path
                        d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)' }}>
                      This reading is lower than the last recorded value. Do you want to continue?
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button
                      type="button"
                      onClick={handleConfirmWarning}
                      disabled={submitting}
                      style={{
                        background: 'var(--color-warning)',
                        color: 'var(--color-on-warning)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: 'var(--font-size-small)',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family-base)',
                      }}
                    >
                      Yes, continue
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWarning(false)}
                      style={{
                        background: 'transparent',
                        color: 'var(--color-muted)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: 'var(--font-size-small)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family-base)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: '0' }} />

              {/* Action row */}
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
                  disabled={submitting || vehicleLoading}
                  style={{
                    minWidth: '180px',
                    fontWeight: 'var(--font-weight-semibold)',
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-6)',
                    fontSize: 'var(--font-size-body)',
                    cursor: submitting || vehicleLoading ? 'not-allowed' : 'pointer',
                    opacity: submitting || vehicleLoading ? 0.75 : 1,
                    fontFamily: 'var(--font-family-base)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    minHeight: 'var(--touch-target-min)',
                  }}
                >
                  {submitting ? (
                    'Saving…'
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Save reading
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/vehicles/${vehicleId}`)}
                  disabled={submitting}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: 'var(--font-size-body)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family-base)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-sm)',
                    minHeight: 'var(--touch-target-min)',
                  }}
                >
                  Cancel
                </button>

                <span
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    marginLeft: 'auto',
                    color: 'var(--color-muted)',
                  }}
                >
                  Source: <strong style={{ color: 'var(--color-ink)' }}>Manual entry</strong>
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Recent readings mini-table */}
        <div
          style={{
            padding: 'var(--space-6)',
            marginTop: 'var(--space-6)',
            background: 'var(--color-surface)',
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-on-surface)',
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
            <h3
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: 'var(--font-weight-h3)',
                color: 'var(--color-ink)',
                margin: '0',
              }}
            >
              Recent readings
            </h3>
            <button
              type="button"
              onClick={() => navigate(`/vehicles/${vehicleId}`)}
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                padding: 'var(--space-1) var(--space-2)',
              }}
            >
              View all
            </button>
          </div>

          {readingsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{
                    height: '36px',
                    borderRadius: 'var(--radius-xs)',
                    background:
                      'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                  }}
                />
              ))}
            </div>
          ) : recentReadings.length === 0 ? (
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                margin: '0',
                textAlign: 'center',
                padding: 'var(--space-6) 0',
              }}
            >
              No readings recorded yet.
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-on-surface)',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--color-border-subtle)',
                  }}
                >
                  {['Date', 'Reading (km)', 'Source', 'Recorded by'].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        textAlign: i === 0 ? 'left' : i === 3 ? 'right' : i === 1 ? 'right' : 'center',
                        padding:
                          i === 0
                            ? 'var(--space-2) var(--space-3) var(--space-2) 0'
                            : i === 3
                            ? 'var(--space-2) 0 var(--space-2) var(--space-3)'
                            : 'var(--space-2) var(--space-3)',
                        color: 'var(--color-muted)',
                        fontWeight: 'var(--font-weight-semibold)',
                        letterSpacing: 'var(--font-letter-spacing-caps)',
                        fontSize: 'var(--font-size-caption)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentReadings.map((reading, idx) => {
                  const src = getSourceLabel(reading.source);
                  const isLast = idx === recentReadings.length - 1;
                  return (
                    <tr
                      key={reading.id}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-3) var(--space-3) 0',
                          color: 'var(--color-body)',
                        }}
                      >
                        {formatDate(reading.reading_timestamp)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: 'var(--space-3)',
                          fontFamily: 'var(--font-family-mono)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        {formatOdometer(reading.odometer_km)}
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          padding: 'var(--space-3)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: 'var(--space-1) var(--space-2)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-size-caption)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background:
                              src.variant === 'success'
                                ? 'var(--color-success-light)'
                                : src.variant === 'warning'
                                ? 'var(--color-warning-light)'
                                : 'var(--color-info-light)',
                            color: 'var(--color-ink)',
                          }}
                        >
                          {src.label}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: 'var(--space-3) 0 var(--space-3) var(--space-3)',
                          color:
                            reading.source === 'telematics' || reading.source === 'telematics_mock'
                              ? 'var(--color-muted)'
                              : 'var(--color-body)',
                          fontStyle:
                            reading.source === 'telematics' || reading.source === 'telematics_mock'
                              ? 'italic'
                              : 'normal',
                        }}
                      >
                        {reading.source === 'telematics' || reading.source === 'telematics_mock'
                          ? 'Auto'
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

export default ManualOdometerPage;
