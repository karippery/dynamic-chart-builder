import { useState, useEffect } from 'react';
import { useNavigation } from './useNavigation';
import { useSumCardData } from './useSumCardData';
import { AggregationFilters } from '../types/filters';
import { getDefaultCloseCallFilters, getResetCloseCallFilters } from '../utils/closeCallUtils';
import { useAggregateData } from './useAggregateData';
import { CloseCallFilters } from '../types/closeCall';
import { useCloseCallData } from './useCloseCallData';


export const useApp = () => {
  // Navigation
  const {
    refreshCount,
    toggleState,
    activePage,
    handleRefresh,
    handleToggleChange,
    handleNavigationChange,
    getPageContent
  } = useNavigation();

  // Main dashboard data
  const { kpiData, isLoading, error, refetch } = useSumCardData(refreshCount);
  
  // Aggregate data
  const [filters, setFilters] = useState<AggregationFilters>({
    metric: 'count',
    entity: '',
    group_by: ['object_class'],
    time_bucket: '1h',
  });
  
  const { aggregateData, isLoading: isAggregateLoading, error: aggregateError, refetch: refetchAggregate } = useAggregateData(filters);

  // Close call data
  const [closeCallFilters, setCloseCallFilters] = useState<CloseCallFilters>(getDefaultCloseCallFilters());
  const [appliedCloseCallFilters, setAppliedCloseCallFilters] = useState<CloseCallFilters>(closeCallFilters);
  
  const { 
    data: closeCallData, 
    kpiData: closeCallKpiData, 
    isLoading: isCloseCallLoading, 
    error: closeCallError, 
    refetch: refetchCloseCalls 
  } = useCloseCallData(appliedCloseCallFilters, refreshCount);

  // Filter states
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [tableFilters, setTableFilters] = useState({
    severity: null as string | null,
    vehicleClass: null as string | null,
  });

  // Main dashboard handlers
  const handleFiltersChange = (newFilters: AggregationFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = async (appliedFilters: AggregationFilters) => {
    setIsFilterLoading(true);
    try {
      // Filter API logic here
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    // Reset filter logic
  };

  // Close-call handlers
  const handleCloseCallFiltersChange = (newFilters: CloseCallFilters) => {
    setCloseCallFilters(newFilters);
  };

  const handleApplyCloseCallFilters = async (appliedFilters: CloseCallFilters) => {
    setIsFilterLoading(true);
    try {
      setAppliedCloseCallFilters(appliedFilters);
      setTableFilters({ severity: null, vehicleClass: null });
    } catch (error) {
      console.error('Error applying close-call filters:', error);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleResetCloseCallFilters = () => {
    const resetFilters = getResetCloseCallFilters();
    setCloseCallFilters(resetFilters);
    setAppliedCloseCallFilters(resetFilters);
    setTableFilters({ severity: null, vehicleClass: null });
  };

  const handleCloseCallPageChange = (page: number, pageSize: number) => {
    setAppliedCloseCallFilters(prev => ({
      ...prev,
      page,
      page_size: pageSize,
    }));
  };

  // Table filter handlers
  const handleSeverityFilter = (severity: string | null) => {
    setTableFilters(prev => ({ ...prev, severity }));
  };

  const handleVehicleClassFilter = (vehicleClass: string | null) => {
    setTableFilters(prev => ({ ...prev, vehicleClass }));
  };

  // Auto-refresh when Live Mode is enabled
  useEffect(() => {
    if (toggleState) {
      const interval = setInterval(() => {
        refetch();
        refetchAggregate();
        refetchCloseCalls();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [toggleState, refetch, refetchAggregate, refetchCloseCalls]);

  return {
    // Navigation
    refreshCount,
    toggleState,
    activePage,
    handleRefresh,
    handleToggleChange,
    handleNavigationChange,
    getPageContent,
    
    // Main dashboard
    kpiData,
    isLoading,
    error,
    filters,
    aggregateData,
    isAggregateLoading,
    aggregateError,
    handleFiltersChange,
    handleApplyFilters,
    handleResetFilters,
    
    // Close call dashboard
    closeCallData,
    closeCallKpiData,
    isCloseCallLoading,
    closeCallError,
    closeCallFilters,
    appliedCloseCallFilters,
    tableFilters,
    handleCloseCallFiltersChange,
    handleApplyCloseCallFilters,
    handleResetCloseCallFilters,
    handleCloseCallPageChange,
    handleSeverityFilter,
    handleVehicleClassFilter,
    
    // Shared states
    isFilterLoading
  };
};