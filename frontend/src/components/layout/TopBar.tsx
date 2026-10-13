import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDepotDashboard } from '../../hooks/useDepotDashboard';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors — user is cleared locally regardless
    }
  };

  const roleLabel: Record<string, string> = {
    administrator: 'Administrator',
    manager: 'Manager',
    technician: 'Technician',
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {user?.role && (
          <span className={styles.roleLabel}>
            {roleLabel[user.role] ?? user.role}
          </span>
        )}
      </div>
      <div className={styles.right}>
        {user && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.full_name}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        )}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopBar;
