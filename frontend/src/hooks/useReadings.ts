import { useState, useEffect, useCallback } from 'react';
import {
  listReadings,
  createReading,
  getReading,
} from '../services/readingsService';
import type { Reading, ReadingCreate } from '../types/reading';
import type { Pagination, ApiError } from '../types/common';

interface ReadingFilters {
  vehicle_id?: string;
  source?: string;
  is_test_mode?: boolean;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

interface UseReadingsResult {
  readings: Reading[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: ApiError | null;
  filters: ReadingFilters;
  setFilters: (filters: ReadingFilters) => void;
  refresh: () => void;
  create: (body: ReadingCreate) => Promise<Reading>;
  fetchById: (readingId: string) => Promise<Reading>;
}

export function useReadings(initialFilters: ReadingFilters = {}): UseReadingsResult {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<ReadingFilters>(initialFilters);

  const fetchReadings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listReadings(filters);
      setReadings(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err as ApiError);
      setReadings([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const create = useCallback(
    async (body: ReadingCreate): Promise<Reading> => {
      const reading = await createReading(body);
      await fetchReadings();
      return reading;
    },
    [fetchReadings],
  );

  const fetchById = useCallback(async (readingId: string): Promise<Reading> => {
    return getReading(readingId);
  }, []);

  return {
    readings,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchReadings,
    create,
    fetchById,
  };
}
