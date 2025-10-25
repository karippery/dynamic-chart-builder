import { useState, useEffect, useCallback } from 'react';
import { safetyApiService } from '../services/safetyApi';
import { SafetyFilters, VestViolationsResponse, OverspeedEventsResponse } from '../types/safety';

interface UseSafetyDataReturn {
  vestViolations: VestViolationsResponse | null;
  overspeedEvents: OverspeedEventsResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSafetyData = (filters: SafetyFilters = {}, refreshCount: number = 0): UseSafetyDataReturn => {
  const [vestViolations, setVestViolations] = useState<VestViolationsResponse | null>(null);
  const [overspeedEvents, setOverspeedEvents] = useState<OverspeedEventsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [vestData, overspeedData] = await Promise.all([
        safetyApiService.getVestViolations(filters),
        safetyApiService.getOverspeedEvents(filters)
      ]);

      setVestViolations(vestData);
      setOverspeedEvents(overspeedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safety data');
      console.error('Error fetching safety data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]); // Include filters as dependency since it's used inside

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshCount]); // Now fetchData is stable and can be included

  return {
    vestViolations,
    overspeedEvents,
    isLoading,
    error,
    refetch: fetchData
  };
};