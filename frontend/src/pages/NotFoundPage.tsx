import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        color: 'var(--color-on-canvas)',
      }}
    >
      {/* Geometric brand accent */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          marginBottom: 'var(--space-8)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            background: 'var(--color-primary-dark)',
            borderRadius: '0 var(--radius-xl) var(--radius-xl) var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="6"
              y="18"
              width="28"
              height="16"
              rx="3"
              fill="var(--color-on-primary-dark)"
              opacity="0.9"
            />
            <rect
              x="6"
              y="18"
              width="40"
              height="16"
              rx="3"
              fill="var(--color-on-primary-dark)"
              opacity="0.5"
            />
            <circle cx="14" cy="38" r="5" fill="var(--color-on-primary-dark)" />
            <circle cx="38" cy="38" r="5" fill="var(--color-on-primary-dark)" />
          </svg>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '32px',
            height: '32px',
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '-8px',
            width: '20px',
            height: '20px',
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>

      {/* Brand name */}
      <p
        style={{
          fontSize: 'var(--font-size-caption)',
          fontWeight: 'var(--font-weight-semibold)',
          letterSpacing: 'var(--font-letter-spacing-caps)',
          color: 'var(--color-primary)',
          textTransform: 'uppercase',
          margin: '0 0 var(--space-4) 0',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        FleetOps
      </p>

      {/* Large 404 display */}
      <div
        style={{
          fontSize: 'clamp(80px, 18vw, 140px)',
          fontWeight: 'var(--font-weight-display)',
          lineHeight: 1,
          color: 'var(--color-primary-dark)',
          letterSpacing: 'var(--font-letter-spacing-tight)',
          margin: '0 0 var(--space-4) 0',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        404
      </div>

      {/* Divider accent */}
      <div
        style={{
          width: '48px',
          height: '4px',
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-full)',
          marginBottom: 'var(--space-6)',
        }}
      />

      {/* Heading */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-h1)',
          color: 'var(--color-ink)',
          textAlign: 'center',
          margin: '0 0 var(--space-3) 0',
          lineHeight: 'var(--font-line-height-h1)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        Page not found
      </h1>

      {/* Body copy */}
      <p
        style={{
          fontSize: 'var(--font-size-body)',
          fontWeight: 'var(--font-weight-body)',
          color: 'var(--color-muted)',
          textAlign: 'center',
          maxWidth: '380px',
          lineHeight: 'var(--font-line-height-body)',
          margin: '0 0 var(--space-8) 0',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        The page you requested does not exist or has been moved. Check the URL or return to a known
        section.
      </p>

      {/* Primary actions */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'var(--color-primary-dark)',
            color: 'var(--color-on-primary-dark)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            minHeight: 'var(--touch-target-min)',
            padding: '0 var(--space-6)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-body)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          Go to dashboard
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            minHeight: 'var(--touch-target-min)',
            padding: '0 var(--space-5)',
            color: 'var(--color-primary)',
            fontSize: 'var(--font-size-body)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          ← Go back
        </button>
      </div>

      {/* Help links */}
      <div
        style={{
          marginTop: 'var(--space-12)',
          display: 'flex',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/vehicles')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          Vehicle list
        </button>
        <button
          type="button"
          onClick={() => navigate('/work-orders')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          Work orders
        </button>
        <button
          type="button"
          onClick={() => navigate('/schedules')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          Schedules
        </button>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
