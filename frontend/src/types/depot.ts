import type { Pagination } from './common';

export interface Depot {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface DepotCreate {
  name: string;
  address?: string;
}

export interface DepotUpdate {
  name?: string;
  address?: string;
}

export interface VehicleServiceSummary {
  vehicle_id: string;
  registration_number: string;
  make: string;
  model: string;
  last_known_odometer_km?: number;
  next_service_due_date: string;
  next_service_due_odometer_km: number;
}

export interface DepotDashboard {
  depot_id: string;
  due_for_service: VehicleServiceSummary[];
  overdue: VehicleServiceSummary[];
}

export interface DepotListResponse {
  data: Depot[];
  pagination: Pagination;
}

export type DepotRead = Depot;

export type DepotDashboardResponse = DepotDashboard;
