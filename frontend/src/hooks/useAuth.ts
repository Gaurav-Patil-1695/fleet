import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, isAuthenticated, isLoading, login, logout, refreshToken } = context;

  const role = user?.role ?? null;

  const isAdministrator = role === 'administrator';
  const isManager = role === 'manager';
  const isTechnician = role === 'technician';

  const hasRole = (requiredRole: string): boolean => role === requiredRole;

  const hasAnyRole = (...roles: string[]): boolean =>
    role !== null && roles.includes(role);

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    isAdministrator,
    isManager,
    isTechnician,
    hasRole,
    hasAnyRole,
    login,
    logout,
    refreshToken,
  };
}
