import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Depot } from '../types/depot';
import { listDepots } from '../services/depotsService';

interface DepotContextValue {
  depots: Depot[];
  activeDepot: Depot | null;
  isLoading: boolean;
  error: string | null;
  setActiveDepot: (depot: Depot | null) => void;
  refreshDepots: () => Promise<void>;
}

export const DepotContext = createContext<DepotContextValue | null>(null);

const ACTIVE_DEPOT_KEY = 'active_depot_id';

function getStoredDepotId(): string | null {
  return localStorage.getItem(ACTIVE_DEPOT_KEY);
}

function storeDepotId(id: string): void {
  localStorage.setItem(ACTIVE_DEPOT_KEY, id);
}

function clearStoredDepotId(): void {
  localStorage.removeItem(ACTIVE_DEPOT_KEY);
}

export function DepotProvider({ children }: { children: React.ReactNode }) {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [activeDepot, setActiveDepotState] = useState<Depot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepots = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listDepots({ page: 1, pageSize: 200 });
      const fetched = response.data;
      setDepots(fetched);

      // Restore previously selected depot if it still exists
      const storedId = getStoredDepotId();
      if (storedId) {
        const found = fetched.find((d) => d.id === storedId) ?? null;
        setActiveDepotState(found);
        if (!found) {
          clearStoredDepotId();
        }
      } else if (fetched.length > 0) {
        // Default to the first depot
        setActiveDepotState(fetched[0]);
        storeDepotId(fetched[0].id);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load depots';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepots();
  }, [fetchDepots]);

  const setActiveDepot = useCallback((depot: Depot | null) => {
    setActiveDepotState(depot);
    if (depot) {
      storeDepotId(depot.id);
    } else {
      clearStoredDepotId();
    }
  }, []);

  const value = useMemo<DepotContextValue>(
    () => ({
      depots,
      activeDepot,
      isLoading,
      error,
      setActiveDepot,
      refreshDepots: fetchDepots,
    }),
    [depots, activeDepot, isLoading, error, setActiveDepot, fetchDepots]
  );

  return (
    <DepotContext.Provider value={value}>{children}</DepotContext.Provider>
  );
}
