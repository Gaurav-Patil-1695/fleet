import React, { useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { usePermission } from '../hooks/usePermission';
import { formatDate } from '../utils/dateUtils';
import { Spinner } from '../components/ui/Spinner';
import styles from './ScheduleDetailPage.module.css';

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  heavy_truck: 'Heavy Truck',
  light_commercial: 'Light Commercial',
  other: 'Other',
};

const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccess } = usePermission();

  const isAdministrator = canAccess(['administrator']);

  const { schedules, loading, error, refetch } = useSchedules();

  const schedule = schedules.find((s) => s.id === id);

  const handleDelete = useCallback(() => {
    // Delete is handled via the schedules service; navigate away after
    navigate('/schedules');
  }, [navigate]);

  // --- Loading state ---
  if (loading) {
    return (
      <div
        style={{
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Breadcrumb skeleton */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-small)',
            color: 'var(--color-muted)',
          }}
        >
          <Link
            to="/schedules"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Schedules
          </Link>
          <span style={{ color: 'var(--color-ink)' }}>›</span>
          <span style={{ color: 'var(--color-muted)' }}>…</span>
        </nav>

        {/* Page title skeleton */}
        <div
          style={{
            height: '32px',
            width: '260px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-raised)',
          }}
          aria-hidden="true"
        />

        {/* Detail card skeleton */}
        <div
          style={{
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              padding: 'var(--space-8) 0',
            }}
          >
            <Spinner />
            <span
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
              }}
            >
              Loading schedule…
            </span>
          </div>

          {/* Skeleton fields */}
          {[
            { w: '35%' },
            { w: '50%' },
            { w: '40%' },
            { w: '45%' },
          ].map((sk, i) => (
            <div
              key={i}
              style={{
                height: '20px',
                width: sk.w,
                borderRadius: 'var(--radius-xs)',
                background: 'var(--color-surface-raised)',
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div
        style={{
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
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
          }}
        >
          <Link
            to="/schedules"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Schedules
          </Link>
          <span style={{ color: 'var(--color-ink)' }}>›</span>
          <span style={{ color: 'var(--color-muted)' }}>Schedule Detail</span>
        </nav>

        {/* Error card */}
        <div
          style={{
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--color-error-light)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-error)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-error)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0, marginTop: '2px' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-error)',
                }}
              >
                Unable to load schedule details — please try again.
              </p>
              {error && (
                <p
                  style={{
                    margin: 'var(--space-1) 0 0',
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-muted)',
                  }}
                >
                  {typeof error === 'object' && 'message' in error
                    ? (error as { message: string }).message
                    : String(error)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={refetch}
              style={{
                flexShrink: 0,
                background: 'var(--color-error)',
                color: 'var(--color-on-error)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Not found state ---
  if (!schedule) {
    navigate('/not-found', { replace: true });
    return null;
  }

  // --- Success state ---
  const vehicleClassLabel =
    VEHICLE_CLASS_LABELS[schedule.vehicle_class] ?? schedule.vehicle_class;

  const activeBadgeStyle: React.CSSProperties = schedule.is_active
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-small)',
        fontWeight: 'var(--font-weight-semibold)',
        background: 'var(--color-success-light)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-success)',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-small)',
        fontWeight: 'var(--font-weight-semibold)',
        background: 'var(--color-surface-raised)',
        color: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
      };

  return (
    <div
      style={{
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        fontFamily: 'var(--font-family-base)',
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
        }}
      >
        <Link
          to="/schedules"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Schedules
        </Link>
        <span style={{ color: 'var(--color-ink)' }}>›</span>
        <span style={{ color: 'var(--color-muted)' }}>
          {vehicleClassLabel}
        </span>
      </nav>

      {/* Page Title Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'var(--font-size-h1)',
              fontWeight: 'var(--font-weight-h1)',
              color: 'var(--color-ink)',
              lineHeight: 'var(--font-line-height-h1)',
            }}
          >
            {vehicleClassLabel} Schedule
          </h1>
          <p
            style={{
              margin: 'var(--space-1) 0 0',
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-muted)',
            }}
          >
            Schedule ID: {schedule.id}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/schedules"
            style={{
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium)',
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              minHeight: 'var(--touch-target-min)',
              boxSizing: 'border-box',
            }}
          >
            ← Back to Schedules
          </Link>

          {isAdministrator && (
            <button
              type="button"
              onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
              style={{
                background: 'var(--color-primary-dark)',
                color: 'var(--color-on-primary-dark)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              ✏️ Edit Schedule
            </button>
          )}
        </div>
      </div>

      {/* Main Detail Card */}
      <div
        style={{
          boxShadow: 'var(--elevation-1)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
          border: '1px solid var(--color-border-subtle)',
          background: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Service Schedule Details
            </p>
          </div>

          <span style={activeBadgeStyle}>
            {schedule.is_active ? '✓ Active' : '— Inactive'}
          </span>
        </div>

        {/* Fields Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-6)',
            color: 'var(--color-on-surface)',
          }}
        >
          {/* Vehicle Type */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Vehicle Type
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-ink)',
              }}
            >
              {vehicleClassLabel}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Type ID: {schedule.vehicle_type_id}
            </span>
          </div>

          {/* Vehicle Class */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Vehicle Class
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-ink)',
              }}
            >
              {vehicleClassLabel}
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Standard classification
            </span>
          </div>

          {/* KM Interval */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              KM Interval
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {schedule.km_interval.toLocaleString()} km
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Service triggered at distance
            </span>
          </div>

          {/* Month Interval */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Month Interval
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-h2)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {schedule.month_interval} months
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-muted)',
              }}
            >
              Service triggered by time
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            margin: 'var(--space-6) 0',
          }}
        />

        {/* Status Row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-caption)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--font-letter-spacing-caps)',
              textTransform: 'uppercase',
              color: 'var(--color-muted)',
            }}
          >
            Schedule Status
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <span style={activeBadgeStyle}>
              {schedule.is_active
                ? '✓ Active — this schedule is currently enforced'
                : '— Inactive — this schedule is not currently enforced'}
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-muted)',
              margin: 0,
            }}
          >
            Vehicles matching this type and class will be flagged for service when either threshold
            is reached, whichever comes first.
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            margin: 'var(--space-6) 0',
          }}
        />

        {/* Timestamps */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Created
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
              }}
            >
              {formatDate(schedule.created_at)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}
            >
              Last Updated
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
              }}
            >
              {formatDate(schedule.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone Card — administrator only */}
      {isAdministrator && (
        <div
          style={{
            boxShadow: 'var(--elevation-1)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5) var(--space-6)',
            border: '1px solid var(--color-error-light)',
            background: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-error)',
                }}
              >
                Delete this schedule
              </p>
              <p
                style={{
                  margin: 'var(--space-1) 0 0',
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--color-muted)',
                }}
              >
                Permanently removes this service schedule. Vehicles linked to this type will no
                longer have automated service intervals. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                whiteSpace: 'nowrap',
                fontSize: 'var(--font-size-small)',
                background: 'var(--color-secondary)',
                color: 'var(--color-on-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-4)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family-base)',
                minHeight: 'var(--touch-target-min)',
              }}
            >
              🗑 Delete Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleDetailPage;
