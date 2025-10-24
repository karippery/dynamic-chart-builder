import { useState, useEffect, useCallback } from 'react';
import { AggregationFilters } from '../types/filters';
import { filterApiService, FilterApiResponse } from '../services/filterApi';

interface UseAggregateDataReturn {
  aggregateData: FilterApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAggregateData = (filters: AggregationFilters): UseAggregateDataReturn => {
  const [aggregateData, setAggregateData] = useState<FilterApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregateData = useCallback(async () => {
    if (!filters) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Remove group_by from filters for aggregate box
      const aggregateFilters = { ...filters, group_by: [] };
      const response = await filterApiService.getFilteredData(aggregateFilters);
      setAggregateData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch aggregate data');
      console.error('❌ Aggregate API Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAggregateData();
  }, [fetchAggregateData]);

  return {
    aggregateData,
    isLoading,
    error,
    refetch: fetchAggregateData,
  };
};