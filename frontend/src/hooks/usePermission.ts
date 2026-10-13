import { useAuth } from './useAuth';

interface UsePermissionResult {
  canManageDepots: boolean;
  canViewDepots: boolean;
  canManageVehicleTypes: boolean;
  canViewVehicleTypes: boolean;
  canManageSchedules: boolean;
  canViewSchedules: boolean;
  canManageVehicles: boolean;
  canViewVehicles: boolean;
  canCreateVehicles: boolean;
  canDeleteVehicles: boolean;
  canManageReadings: boolean;
  canViewReadings: boolean;
  canCreateReadings: boolean;
  canManageWorkOrders: boolean;
  canViewWorkOrders: boolean;
  canCreateWorkOrders: boolean;
  canUpdateWorkOrders: boolean;
  canDeleteWorkOrders: boolean;
  canAssignWorkOrders: boolean;
  canCloseWorkOrders: boolean;
  canViewMyWorkOrders: boolean;
  canViewDashboard: boolean;
  canIngestTelematics: boolean;
  isAdministrator: boolean;
  isManager: boolean;
  isTechnician: boolean;
}

export function usePermission(): UsePermissionResult {
  const { isAdministrator, isManager, isTechnician } = useAuth();

  return {
    // Depot permissions
    canManageDepots: isAdministrator,
    canViewDepots: isAdministrator || isManager,

    // VehicleType permissions
    canManageVehicleTypes: isAdministrator,
    canViewVehicleTypes: isAdministrator || isManager || isTechnician,

    // Schedule permissions
    canManageSchedules: isAdministrator,
    canViewSchedules: isAdministrator || isManager,

    // Vehicle permissions
    canManageVehicles: isAdministrator || isManager,
    canViewVehicles: isAdministrator || isManager || isTechnician,
    canCreateVehicles: isAdministrator || isManager,
    canDeleteVehicles: isAdministrator,

    // Reading permissions
    canManageReadings: isAdministrator || isManager,
    canViewReadings: isAdministrator || isManager || isTechnician,
    canCreateReadings: isAdministrator || isManager || isTechnician,

    // Work order permissions
    canManageWorkOrders: isAdministrator || isManager,
    canViewWorkOrders: isAdministrator || isManager || isTechnician,
    canCreateWorkOrders: isAdministrator || isManager,
    canUpdateWorkOrders: isAdministrator || isManager,
    canDeleteWorkOrders: isAdministrator,
    canAssignWorkOrders: isAdministrator || isManager,
    canCloseWorkOrders: isTechnician,
    canViewMyWorkOrders: isTechnician,

    // Dashboard permissions
    canViewDashboard: isManager || isTechnician,

    // Telematics permissions
    canIngestTelematics: isAdministrator || isManager || isTechnician,

    // Role flags
    isAdministrator,
    isManager,
    isTechnician,
  };
}
