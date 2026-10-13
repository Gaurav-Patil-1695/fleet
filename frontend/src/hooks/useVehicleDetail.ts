import { useState, useEffect, useCallback } from 'react';
import {
  getVehicle,
  listVehicleReadings,
  listVehicleWorkOrders,
} from '../services/vehiclesService';
import type { Vehicle } from '../types/vehicle';
import type { Reading, ReadingListResponse } from '../types/reading';
import type { WorkOrder, WorkOrderListResponse } from '../types/workOrder';
import type { Pagination, ApiError } from '../types/common';

interface ReadingFilters {
  source?: string;
  is_test_mode?: boolean;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

interface WorkOrderFilters {
  status?: string;
  assigned_technician_id?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

interface UseVehicleDetailResult {
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: ApiError | null;
  readings: Reading[];
  readingsPagination: Pagination | null;
  readingsLoading: boolean;
  readingsError: ApiError | null;
  readingFilters: ReadingFilters;
  setReadingFilters: (filters: ReadingFilters) => void;
  workOrders: WorkOrder[];
  workOrdersPagination: Pagination | null;
  workOrdersLoading: boolean;
  workOrdersError: ApiError | null;
  workOrderFilters: WorkOrderFilters;
  setWorkOrderFilters: (filters: WorkOrderFilters) => void;
  refresh: () => void;
  refreshReadings: () => void;
  refreshWorkOrders: () => void;
}

export function useVehicleDetail(
  vehicleId: string | null,
  initialReadingFilters: ReadingFilters = {},
  initialWorkOrderFilters: WorkOrderFilters = {},
): UseVehicleDetailResult {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [readings, setReadings] = useState<Reading[]>([]);
  const [readingsPagination, setReadingsPagination] = useState<Pagination | null>(null);
  const [readingsLoading, setReadingsLoading] = useState<boolean>(false);
  const [readingsError, setReadingsError] = useState<ApiError | null>(null);
  const [readingFilters, setReadingFilters] = useState<ReadingFilters>(initialReadingFilters);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrdersPagination, setWorkOrdersPagination] = useState<Pagination | null>(null);
  const [workOrdersLoading, setWorkOrdersLoading] = useState<boolean>(false);
  const [workOrdersError, setWorkOrdersError] = useState<ApiError | null>(null);
  const [workOrderFilters, setWorkOrderFilters] = useState<WorkOrderFilters>(initialWorkOrderFilters);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) {
      setVehicle(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getVehicle(vehicleId);
      setVehicle(data);
    } catch (err) {
      setError(err as ApiError);
      setVehicle(null);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  const fetchReadings = useCallback(async () => {
    if (!vehicleId) {
      setReadings([]);
      setReadingsPagination(null);
      setReadingsError(null);
      return;
    }

    setReadingsLoading(true);
    setReadingsError(null);

    try {
      const response: ReadingListResponse = await listVehicleReadings(vehicleId, readingFilters);
      setReadings(response.data);
      setReadingsPagination(response.pagination);
    } catch (err) {
      setReadingsError(err as ApiError);
      setReadings([]);
      setReadingsPagination(null);
    } finally {
      setReadingsLoading(false);
    }
  }, [vehicleId, readingFilters]);

  const fetchWorkOrders = useCallback(async () => {
    if (!vehicleId) {
      setWorkOrders([]);
      setWorkOrdersPagination(null);
      setWorkOrdersError(null);
      return;
    }

    setWorkOrdersLoading(true);
    setWorkOrdersError(null);

    try {
      const response: WorkOrderListResponse = await listVehicleWorkOrders(vehicleId, workOrderFilters);
      setWorkOrders(response.data);
      setWorkOrdersPagination(response.pagination);
    } catch (err) {
      setWorkOrdersError(err as ApiError);
      setWorkOrders([]);
      setWorkOrdersPagination(null);
    } finally {
      setWorkOrdersLoading(false);
    }
  }, [vehicleId, workOrderFilters]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const refresh = useCallback(() => {
    fetchVehicle();
    fetchReadings();
    fetchWorkOrders();
  }, [fetchVehicle, fetchReadings, fetchWorkOrders]);

  return {
    vehicle,
    isLoading,
    error,
    readings,
    readingsPagination,
    readingsLoading,
    readingsError,
    readingFilters,
    setReadingFilters,
    workOrders,
    workOrdersPagination,
    workOrdersLoading,
    workOrdersError,
    workOrderFilters,
    setWorkOrderFilters,
    refresh,
    refreshReadings: fetchReadings,
    refreshWorkOrders: fetchWorkOrders,
  };
}
