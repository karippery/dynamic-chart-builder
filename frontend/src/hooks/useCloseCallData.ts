import { useState, useEffect } from 'react';
import { CloseCallResponse, CloseCallFilters, CloseCallKpiData } from '../types/closeCall';
import { closeCallApiService } from '../services/closeCallApi';

export const useCloseCallData = (filters: CloseCallFilters, refreshCount: number = 0) => {
  const [data, setData] = useState<CloseCallResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCloseCalls = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await closeCallApiService.getCloseCalls(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch close call data');
        console.error('Error fetching close call data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCloseCalls();
  }, [filters, refreshCount]);

  // Transform API response to KPI data - CORRECTED calculation
  const kpiData: CloseCallKpiData | null = data ? {
    totalCloseCalls: data.total_count,
    highSeverity: data.by_severity.HIGH || 0,
    mediumSeverity: data.by_severity.MEDIUM || 0,
    lowSeverity: data.by_severity.LOW || 0,
    humanDetections: data.statistics.human_detections_processed,
    vehicleDetections: data.statistics.vehicle_detections_processed,
    detectionRate: data.statistics.human_detections_processed > 0 
      ? (data.total_count / data.statistics.human_detections_processed) * 100 
      : 0
  } : null;

  const refetch = () => {
    // This will trigger useEffect via refreshCount dependency
  };

  return {
    data,
    kpiData,
    isLoading,
    error,
    refetch
  };
};