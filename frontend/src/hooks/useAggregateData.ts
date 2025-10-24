// frontend/src/hooks/useAggregateData.ts
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
      // For aggregate box: remove group_by to get single value
      // For chart: keep group_by to get time series data
      const aggregateFilters = { ...filters };
      
      // If no group_by is specified, use default time_bucket grouping for charts
      if (aggregateFilters.group_by.length === 0) {
        aggregateFilters.group_by = ['time_bucket'];
      }
      
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