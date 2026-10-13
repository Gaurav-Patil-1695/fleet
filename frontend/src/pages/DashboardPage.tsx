import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDepotDashboard } from '../hooks/useDepotDashboard';
import { OverdueVehicleRow } from '../components/depot/OverdueVehicleRow';
import { DueVehicleRow } from '../components/depot/DueVehicleRow';
import { DashboardStats } from '../components/depot/DashboardStats';
import { Spinner } from '../components/ui/Spinner';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const depotId = user?.depot_id ?? '';
  const depotName = 'Depot';

  const { dashboard, loading, error, refetch } = useDepotDashboard(depotId);

  const overdueVehicles = dashboard?.overdue ?? [];
  const dueVehicles = dashboard?.due_for_service ?? [];

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const renderSkeletonRows = (count: number) => (
    <div className={styles.skeletonStack}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonLine} style={{ width: '40%' }} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
          <div className={styles.skeletonLine} style={{ width: '30%' }} />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden="true">🚗</span>
      <p className={styles.emptyText}>No vehicles are currently due or overdue for service at this depot.</p>
    </div>
  );

  const renderErrorState = () => (
    <div className={styles.errorBanner} role="alert">
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
        className={styles.errorIcon}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className={styles.errorText}>Unable to load the service due list. Please try again.</span>
      <button className={styles.retryBtn} onClick={refetch} type="button">
        Retry
      </button>
    </div>
  );

  const isEmptyDashboard =
    !loading && !error && overdueVehicles.length === 0 && dueVehicles.length === 0;

  return (
    <div className={styles.page}>
      {/* Page title */}
      <h1 className={styles.pageTitle}>Depot Dashboard</h1>
      <p className={styles.subtitle}>
        {depotName} · Last updated just now
      </p>

      {/* Summary bar */}
      <DashboardStats
        overdueCount={overdueVehicles.length}
        dueCount={dueVehicles.length}
        totalFleet={0}
        openWorkOrders={0}
      />

      {/* Quick actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.btnPrimary}
          type="button"
          onClick={() => navigate('/vehicles')}
        >
          View all vehicles
        </button>
        <button
          className={styles.btnSecondary}
          type="button"
          onClick={() => navigate('/work-orders')}
        >
          Work orders
        </button>
        <button
          className={styles.btnGhost}
          type="button"
          onClick={() => navigate('/work-orders/new')}
        >
          + New work order
        </button>
      </div>

      {/* Error state */}
      {error && renderErrorState()}

      {/* Empty state — both sections empty */}
      {isEmptyDashboard && renderEmptyState()}

      {/* Overdue section */}
      {!error && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>⚠ Overdue</span>
            <span className={styles.badgeError}>
              {loading ? '…' : `${overdueVehicles.length} vehicles`}
            </span>
          </div>

          {loading ? (
            renderSkeletonRows(3)
          ) : overdueVehicles.length === 0 && !isEmptyDashboard ? (
            <p className={styles.sectionEmpty}>No overdue vehicles.</p>
          ) : (
            <div className={styles.cardStack}>
              {overdueVehicles.map((v) => (
                <OverdueVehicleRow
                  key={v.vehicle_id}
                  vehicle={v}
                  onClick={() => handleVehicleClick(v.vehicle_id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Due for service section */}
      {!error && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>🕐 Due for Service</span>
            <span className={styles.badgeWarning}>
              {loading ? '…' : `${dueVehicles.length} vehicles`}
            </span>
          </div>

          {loading ? (
            renderSkeletonRows(3)
          ) : dueVehicles.length === 0 && !isEmptyDashboard ? (
            <p className={styles.sectionEmpty}>No vehicles due for service.</p>
          ) : (
            <div className={styles.cardStack}>
              {dueVehicles.map((v) => (
                <DueVehicleRow
                  key={v.vehicle_id}
                  vehicle={v}
                  onClick={() => handleVehicleClick(v.vehicle_id)}
                />
              ))}
            </div>
          )}

          {!loading && dueVehicles.length > 3 && (
            <div className={styles.viewMore}>
              <button
                className={styles.btnGhost}
                type="button"
                onClick={() => navigate('/vehicles')}
              >
                View all {dueVehicles.length - 3} remaining vehicles due for service →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Footer shortcut row */}
      <div className={styles.footerRow}>
        <button
          className={styles.footerLink}
          type="button"
          onClick={() => navigate('/schedules')}
        >
          View maintenance schedules
        </button>
        <button
          className={styles.footerLink}
          type="button"
          onClick={() => navigate(`/vehicles/${depotId}/readings/new`)}
        >
          Enter odometer reading
        </button>
        <button
          className={styles.footerLink}
          type="button"
          onClick={() => navigate('/my-work-orders')}
        >
          My work orders
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
