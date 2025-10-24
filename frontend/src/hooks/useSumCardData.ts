import { useState, useEffect, useCallback } from 'react';
import { KpiSummaryData } from '../types/sumcard';
import { aggregateApiService } from '../services/aggregateApi';

export const useSumCardData = (refreshCount: number) => { // Changed from useKpiData to useSumCardData
  const [kpiData, setKpiData] = useState<KpiSummaryData>({
    totalCount: 0,
    humanCount: 0,
    vehicleCount: 0,
    vestViolationCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use aggregateApiService for all calls (not mixed with apiService)
      const [totalCount, humanCount, vehicleCount, vestViolationCount] = await Promise.all([
        aggregateApiService.getTotalCount(),
        aggregateApiService.getHumanCount(), // Fixed: was apiService.getHumanCount()
        aggregateApiService.getVehicleCount(), // Fixed: was apiService.getVehicleCount()
        aggregateApiService.getVestViolationCount(), // Fixed: was apiService.getVestViolationCount()
      ]);

      setKpiData({
        totalCount,
        humanCount,
        vehicleCount,
        vestViolationCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI data');
      console.error('Error fetching KPI data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData, refreshCount]);

  const refetch = () => {
    fetchKpiData();
  };

  return {
    kpiData,
    isLoading,
    error,
    refetch,
  };
};