import { useState, useEffect, useCallback } from 'react';
import {
  listWorkOrders,
  createWorkOrder,
  getWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  assignWorkOrder,
  closeWorkOrder,
} from '../services/workOrdersService';
import type {
  WorkOrder,
  WorkOrderCreate,
  WorkOrderUpdate,
  WorkOrderAssign,
  WorkOrderClose,
} from '../types/workOrder';
import type { Pagination, ApiError } from '../types/common';

interface WorkOrderFilters {
  page?: number;
  page_size?: number;
  status?: string;
  depot_id?: string;
}

interface UseWorkOrdersResult {
  workOrders: WorkOrder[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: ApiError | null;
  filters: WorkOrderFilters;
  setFilters: (filters: WorkOrderFilters) => void;
  refresh: () => void;
  create: (body: WorkOrderCreate) => Promise<WorkOrder>;
  fetchById: (workOrderId: string) => Promise<WorkOrder>;
  update: (workOrderId: string, body: WorkOrderUpdate) => Promise<WorkOrder>;
  remove: (workOrderId: string) => Promise<void>;
  assign: (workOrderId: string, body: WorkOrderAssign) => Promise<WorkOrder>;
  close: (workOrderId: string, body: WorkOrderClose) => Promise<WorkOrder>;
}

export function useWorkOrders(initialFilters: WorkOrderFilters = {}): UseWorkOrdersResult {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<WorkOrderFilters>(initialFilters);

  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listWorkOrders(filters);
      setWorkOrders(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err as ApiError);
      setWorkOrders([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const create = useCallback(
    async (body: WorkOrderCreate): Promise<WorkOrder> => {
      const workOrder = await createWorkOrder(body);
      await fetchWorkOrders();
      return workOrder;
    },
    [fetchWorkOrders],
  );

  const fetchById = useCallback(async (workOrderId: string): Promise<WorkOrder> => {
    return getWorkOrder(workOrderId);
  }, []);

  const update = useCallback(
    async (workOrderId: string, body: WorkOrderUpdate): Promise<WorkOrder> => {
      const workOrder = await updateWorkOrder(workOrderId, body);
      await fetchWorkOrders();
      return workOrder;
    },
    [fetchWorkOrders],
  );

  const remove = useCallback(
    async (workOrderId: string): Promise<void> => {
      await deleteWorkOrder(workOrderId);
      await fetchWorkOrders();
    },
    [fetchWorkOrders],
  );

  const assign = useCallback(
    async (workOrderId: string, body: WorkOrderAssign): Promise<WorkOrder> => {
      const workOrder = await assignWorkOrder(workOrderId, body);
      await fetchWorkOrders();
      return workOrder;
    },
    [fetchWorkOrders],
  );

  const close = useCallback(
    async (workOrderId: string, body: WorkOrderClose): Promise<WorkOrder> => {
      const workOrder = await closeWorkOrder(workOrderId, body);
      await fetchWorkOrders();
      return workOrder;
    },
    [fetchWorkOrders],
  );

  return {
    workOrders,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchWorkOrders,
    create,
    fetchById,
    update,
    remove,
    assign,
    close,
  };
}
