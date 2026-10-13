import apiClient from './apiClient';
import type { Vehicle, VehicleListResponse, VehicleCreate, VehicleUpdate } from '../types/vehicle';
import type { ReadingListResponse } from '../types/reading';
import type { WorkOrderListResponse } from '../types/workOrder';

export interface ListVehiclesParams {
  depot_id?: string;
  vehicle_type_id?: string;
  status?: string;
  has_telematics?: boolean;
  page?: number;
  page_size?: number;
}

export interface ListVehicleReadingsParams {
  source?: string;
  is_test_mode?: boolean;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export interface ListVehicleWorkOrdersParams {
  status?: string;
  assigned_technician_id?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export async function listVehicles(params?: ListVehiclesParams): Promise<VehicleListResponse> {
  const response = await apiClient.get<VehicleListResponse>('/vehicles', {
    params: {
      depot_id: params?.depot_id,
      vehicle_type_id: params?.vehicle_type_id,
      status: params?.status,
      has_telematics: params?.has_telematics,
      page: params?.page,
      page_size: params?.page_size,
    },
  });
  return response.data;
}

export async function createVehicle(body: VehicleCreate): Promise<Vehicle> {
  const response = await apiClient.post<Vehicle>('/vehicles', body);
  return response.data;
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
  const response = await apiClient.get<Vehicle>(`/vehicles/${vehicleId}`);
  return response.data;
}

export async function updateVehicle(vehicleId: string, body: VehicleUpdate): Promise<Vehicle> {
  const response = await apiClient.put<Vehicle>(`/vehicles/${vehicleId}`, body);
  return response.data;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await apiClient.delete(`/vehicles/${vehicleId}`);
}

export async function listVehicleReadings(
  vehicleId: string,
  params?: ListVehicleReadingsParams,
): Promise<ReadingListResponse> {
  const response = await apiClient.get<ReadingListResponse>(`/vehicles/${vehicleId}/readings`, {
    params: {
      source: params?.source,
      is_test_mode: params?.is_test_mode,
      from: params?.from,
      to: params?.to,
      page: params?.page,
      page_size: params?.page_size,
    },
  });
  return response.data;
}

export async function listVehicleWorkOrders(
  vehicleId: string,
  params?: ListVehicleWorkOrdersParams,
): Promise<WorkOrderListResponse> {
  const response = await apiClient.get<WorkOrderListResponse>(`/vehicles/${vehicleId}/work-orders`, {
    params: {
      status: params?.status,
      assigned_technician_id: params?.assigned_technician_id,
      from: params?.from,
      to: params?.to,
      page: params?.page,
      page_size: params?.page_size,
    },
  });
  return response.data;
}
