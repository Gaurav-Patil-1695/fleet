import { useState, useEffect, useCallback } from 'react';
import {
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/schedulesService';
import type { Schedule, ScheduleCreate, ScheduleUpdate } from '../types/schedule';
import type { Pagination, ApiError } from '../types/common';

interface ScheduleFilters {
  page?: number;
  limit?: number;
  vehicle_type_id?: string;
  vehicle_class?: string;
  is_active?: boolean;
}

interface UseSchedulesResult {
  schedules: Schedule[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: ApiError | null;
  filters: ScheduleFilters;
  setFilters: (filters: ScheduleFilters) => void;
  refresh: () => void;
  create: (body: ScheduleCreate) => Promise<Schedule>;
  fetchById: (scheduleId: string) => Promise<Schedule>;
  update: (scheduleId: string, body: ScheduleUpdate) => Promise<Schedule>;
  remove: (scheduleId: string) => Promise<void>;
}

export function useSchedules(initialFilters: ScheduleFilters = {}): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<ScheduleFilters>(initialFilters);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listSchedules(filters);
      setSchedules(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err as ApiError);
      setSchedules([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const create = useCallback(
    async (body: ScheduleCreate): Promise<Schedule> => {
      const schedule = await createSchedule(body);
      await fetchSchedules();
      return schedule;
    },
    [fetchSchedules],
  );

  const fetchById = useCallback(async (scheduleId: string): Promise<Schedule> => {
    return getSchedule(scheduleId);
  }, []);

  const update = useCallback(
    async (scheduleId: string, body: ScheduleUpdate): Promise<Schedule> => {
      const schedule = await updateSchedule(scheduleId, body);
      await fetchSchedules();
      return schedule;
    },
    [fetchSchedules],
  );

  const remove = useCallback(
    async (scheduleId: string): Promise<void> => {
      await deleteSchedule(scheduleId);
      await fetchSchedules();
    },
    [fetchSchedules],
  );

  return {
    schedules,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchSchedules,
    create,
    fetchById,
    update,
    remove,
  };
}
