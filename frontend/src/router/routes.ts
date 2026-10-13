export const ROUTES = {
  Login: '/login',
  DepotDashboard: '/dashboard',
  VehicleList: '/vehicles',
  VehicleDetail: '/vehicles/:id',
  AddVehicle: '/vehicles/new',
  EditVehicle: '/vehicles/:id/edit',
  ManualOdometerEntry: '/vehicles/:id/readings/new',
  WorkOrderList: '/work-orders',
  WorkOrderDetail: '/work-orders/:id',
  CreateWorkOrder: '/work-orders/new',
  CloseWorkOrder: '/work-orders/:id/close',
  MyWorkOrders: '/my-work-orders',
  ScheduleList: '/schedules',
  ScheduleDetail: '/schedules/:id',
  CreateSchedule: '/schedules/new',
  EditSchedule: '/schedules/:id/edit',
  NotFound: '/404',
  Unauthorized: '/403',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
