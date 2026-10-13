import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  to: string;
  roles?: Array<'administrator' | 'manager' | 'technician'>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Depot Dashboard',
        to: '/dashboard',
        roles: ['manager', 'technician'],
      },
    ],
  },
  {
    label: 'Vehicles',
    items: [
      {
        label: 'Vehicle List',
        to: '/vehicles',
        roles: ['administrator', 'manager', 'technician'],
      },
      {
        label: 'Add Vehicle',
        to: '/vehicles/new',
        roles: ['administrator', 'manager'],
      },
      {
        label: 'Manual Odometer Entry',
        to: '/odometer',
        roles: ['administrator', 'manager', 'technician'],
      },
    ],
  },
  {
    label: 'Work Orders',
    items: [
      {
        label: 'Work Order List',
        to: '/work-orders',
        roles: ['manager', 'technician'],
      },
      {
        label: 'Create Work Order',
        to: '/work-orders/new',
        roles: ['administrator', 'manager'],
      },
      {
        label: 'My Work Orders',
        to: '/my-work-orders',
        roles: ['technician'],
      },
    ],
  },
  {
    label: 'Schedules',
    items: [
      {
        label: 'Schedule List',
        to: '/schedules',
        roles: ['administrator', 'manager'],
      },
      {
        label: 'Create Schedule',
        to: '/schedules/new',
        roles: ['administrator'],
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role as 'administrator' | 'manager' | 'technician' | undefined;

  const isAllowed = (roles?: Array<'administrator' | 'manager' | 'technician'>) => {
    if (!roles || roles.length === 0) return true;
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span>FleetOps</span>
      </div>
      <nav className={styles.nav}>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => isAllowed(item.roles));
          if (visibleItems.length === 0) return null;
          return (
            <React.Fragment key={group.label}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [styles.navLink, isActive ? styles.active : ''].filter(Boolean).join(' ')
                  }
                  end={item.to === '/dashboard'}
                >
                  {item.label}
                </NavLink>
              ))}
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
