import apiClient from './apiClient';
import type { Depot, DepotListResponse, DepotCreate, DepotUpdate, DepotDashboard } from '../types/depot';

export interface ListDepotsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function listDepots(params?: ListDepotsParams): Promise<DepotListResponse> {
  const response = await apiClient.get<DepotListResponse>('/depots', {
    params: {
      page: params?.page,
      page_size: params?.pageSize,
      search: params?.search,
    },
  });
  return response.data;
}

export async function createDepot(body: DepotCreate): Promise<Depot> {
  const response = await apiClient.post<Depot>('/depots', body);
  return response.data;
}

export async function getDepot(depotId: string): Promise<Depot> {
  const response = await apiClient.get<Depot>(`/depots/${depotId}`);
  return response.data;
}

export async function updateDepot(depotId: string, body: DepotUpdate): Promise<Depot> {
  const response = await apiClient.put<Depot>(`/depots/${depotId}`, body);
  return response.data;
}

export async function deleteDepot(depotId: string): Promise<void> {
  await apiClient.delete(`/depots/${depotId}`);
}

export async function getDepotDashboard(depotId: string): Promise<DepotDashboard> {
  const response = await apiClient.get<DepotDashboard>(`/depots/${depotId}/dashboard`);
  return response.data;
}
