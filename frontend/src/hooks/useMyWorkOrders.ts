import { useState, useEffect, useCallback } from 'react';
import { listMyWorkOrders } from '../services/workOrdersService';
import type { WorkOrder } from '../types/workOrder';
import type { Pagination, ApiError } from '../types/common';

interface MyWorkOrderFilters {
  page?: number;
  page_size?: number;
  status?: string;
}

interface UseMyWorkOrdersResult {
  workOrders: WorkOrder[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: ApiError | null;
  filters: MyWorkOrderFilters;
  setFilters: (filters: MyWorkOrderFilters) => void;
  refresh: () => void;
}

export function useMyWorkOrders(initialFilters: MyWorkOrderFilters = {}): UseMyWorkOrdersResult {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<MyWorkOrderFilters>(initialFilters);

  const fetchMyWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listMyWorkOrders(filters);
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
    fetchMyWorkOrders();
  }, [fetchMyWorkOrders]);

  return {
    workOrders,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchMyWorkOrders,
  };
}
