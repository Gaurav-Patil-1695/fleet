import { useState, useEffect, useCallback } from 'react';
import { getDepotDashboard } from '../services/depotsService';
import type { DepotDashboard } from '../types/depot';
import type { ApiError } from '../types/common';

interface UseDepotDashboardResult {
  dashboard: DepotDashboard | null;
  isLoading: boolean;
  error: ApiError | null;
  refresh: () => void;
}

export function useDepotDashboard(depotId: string | null): UseDepotDashboardResult {
  const [dashboard, setDashboard] = useState<DepotDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!depotId) {
      setDashboard(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getDepotDashboard(depotId);
      setDashboard(data);
    } catch (err) {
      setError(err as ApiError);
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [depotId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
