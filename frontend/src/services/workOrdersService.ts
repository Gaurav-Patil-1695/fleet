import apiClient from './apiClient';
import type {
  WorkOrder,
  WorkOrderListResponse,
  WorkOrderCreate,
  WorkOrderUpdate,
  WorkOrderAssign,
  WorkOrderClose,
} from '../types/workOrder';

export interface ListWorkOrdersParams {
  page?: number;
  page_size?: number;
  status?: string;
  depot_id?: string;
}

export interface ListMyWorkOrdersParams {
  page?: number;
  page_size?: number;
  status?: string;
}

export async function listWorkOrders(params?: ListWorkOrdersParams): Promise<WorkOrderListResponse> {
  const response = await apiClient.get<WorkOrderListResponse>('/work-orders', {
    params: {
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status,
      depot_id: params?.depot_id,
    },
  });
  return response.data;
}

export async function listMyWorkOrders(params?: ListMyWorkOrdersParams): Promise<WorkOrderListResponse> {
  const response = await apiClient.get<WorkOrderListResponse>('/work-orders/my', {
    params: {
      page: params?.page,
      page_size: params?.page_size,
      status: params?.status,
    },
  });
  return response.data;
}

export async function createWorkOrder(body: WorkOrderCreate): Promise<WorkOrder> {
  const response = await apiClient.post<WorkOrder>('/work-orders', body);
  return response.data;
}

export async function getWorkOrder(workOrderId: string): Promise<WorkOrder> {
  const response = await apiClient.get<WorkOrder>(`/work-orders/${workOrderId}`);
  return response.data;
}

export async function updateWorkOrder(workOrderId: string, body: WorkOrderUpdate): Promise<WorkOrder> {
  const response = await apiClient.put<WorkOrder>(`/work-orders/${workOrderId}`, body);
  return response.data;
}

export async function deleteWorkOrder(workOrderId: string): Promise<void> {
  await apiClient.delete(`/work-orders/${workOrderId}`);
}

export async function assignWorkOrder(workOrderId: string, body: WorkOrderAssign): Promise<WorkOrder> {
  const response = await apiClient.post<WorkOrder>(`/work-orders/${workOrderId}/assign`, body);
  return response.data;
}

export async function closeWorkOrder(workOrderId: string, body: WorkOrderClose): Promise<WorkOrder> {
  const response = await apiClient.post<WorkOrder>(`/work-orders/${workOrderId}/close`, body);
  return response.data;
}
