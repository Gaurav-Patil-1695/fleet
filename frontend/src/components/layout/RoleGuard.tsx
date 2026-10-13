import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  roles: Array<'administrator' | 'manager' | 'technician'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.role as 'administrator' | 'manager' | 'technician';

  if (!roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
