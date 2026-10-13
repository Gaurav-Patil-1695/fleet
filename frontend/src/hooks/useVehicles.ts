import { useState, useEffect, useCallback } from 'react';
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../services/vehiclesService';
import type { Vehicle, VehicleCreate, VehicleUpdate } from '../types/vehicle';
import type { Pagination, ApiError } from '../types/common';

interface VehicleFilters {
  depot_id?: string;
  vehicle_type_id?: string;
  status?: string;
  has_telematics?: boolean;
  page?: number;
  page_size?: number;
}

interface UseVehiclesResult {
  vehicles: Vehicle[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: ApiError | null;
  filters: VehicleFilters;
  setFilters: (filters: VehicleFilters) => void;
  refresh: () => void;
  create: (body: VehicleCreate) => Promise<Vehicle>;
  update: (vehicleId: string, body: VehicleUpdate) => Promise<Vehicle>;
  remove: (vehicleId: string) => Promise<void>;
}

export function useVehicles(initialFilters: VehicleFilters = {}): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listVehicles(filters);
      setVehicles(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err as ApiError);
      setVehicles([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const create = useCallback(
    async (body: VehicleCreate): Promise<Vehicle> => {
      const vehicle = await createVehicle(body);
      await fetchVehicles();
      return vehicle;
    },
    [fetchVehicles],
  );

  const update = useCallback(
    async (vehicleId: string, body: VehicleUpdate): Promise<Vehicle> => {
      const vehicle = await updateVehicle(vehicleId, body);
      await fetchVehicles();
      return vehicle;
    },
    [fetchVehicles],
  );

  const remove = useCallback(
    async (vehicleId: string): Promise<void> => {
      await deleteVehicle(vehicleId);
      await fetchVehicles();
    },
    [fetchVehicles],
  );

  return {
    vehicles,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchVehicles,
    create,
    update,
    remove,
  };
}
