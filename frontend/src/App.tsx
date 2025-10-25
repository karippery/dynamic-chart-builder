import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Alert, Grid } from '@mui/material';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useNavigation } from './hooks/useNavigation';
import { useSumCardData } from './hooks/useSumCardData';
import NavBar from './components/NavBar';
import DashboardFilter from './components/DashboardFilter';
import { AggregationFilters } from './types/filters';
import { filterApiService, FilterApiResponse } from './services/filterApi';
import { useAggregateData } from './hooks/useAggregateData';
import AggregateBox from './components/AggregateBox';
import ChartVisualization from './components/ChartVisualization';
import { ChartType } from './types/charts';
import DashboardFileUpload from './components/DashboardFileUpload';
import { CloseCallFilters } from './types/closeCall';
import { useCloseCallData } from './hooks/useCloseCallData';
import CloseCallFilter from './components/CloseCallFilter';
import CloseCallKpiSummary from './components/CloseCallKpiSummary';
import CloseCallDetails from './components/CloseCallDetails';
import { getDefaultCloseCallFilters, getResetCloseCallFilters } from './utils/closeCallUtils';
import { SafetyDashboard } from './components/SafetyDashboard';
import KpiSummary from './components/tools/kpiCard/KpiSummary';
import CloseCallSummaryCards from './components/CloseCallSummaryCards';

function App() {
  const { 
    refreshCount,
    toggleState, 
    activePage,
    handleRefresh, 
    handleToggleChange, 
    handleNavigationChange,
    getPageContent 
  } = useNavigation();

  const { kpiData, isLoading, error, refetch } = useSumCardData(refreshCount);
  
  const [filters, setFilters] = useState<AggregationFilters>({
    metric: 'count',
    entity: '',
    group_by: ['object_class'],
    time_bucket: '1h',
  });
  const handleCloseCallPageChange = (page: number, pageSize: number) => {
    setAppliedCloseCallFilters(prev => ({
      ...prev,
      page,
      page_size: pageSize,
    }));
  };
  const { aggregateData, isLoading: isAggregateLoading, error: aggregateError, refetch: refetchAggregate } = useAggregateData(filters);

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<FilterApiResponse | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');

  const [closeCallFilters, setCloseCallFilters] = useState<CloseCallFilters>(getDefaultCloseCallFilters());
  const [appliedCloseCallFilters, setAppliedCloseCallFilters] = useState<CloseCallFilters>(closeCallFilters);
  const [tableFilters, setTableFilters] = useState<{
    severity: string | null;
    vehicleClass: string | null;
  }>({
    severity: null,
    vehicleClass: null,
  });

  const { 
    data: closeCallData, 
    kpiData: closeCallKpiData, 
    isLoading: isCloseCallLoading, 
    error: closeCallError, 
    refetch: refetchCloseCalls 
  } = useCloseCallData(appliedCloseCallFilters, refreshCount);

  const pageContent = getPageContent();

  // Main dashboard handlers
  const handleFiltersChange = (newFilters: AggregationFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = async (appliedFilters: AggregationFilters) => {
    setIsFilterLoading(true);
    try {
      const response = await filterApiService.getFilteredData(appliedFilters);
      setApiResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      setApiResponse(null);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    setApiResponse(null);
  };

  // Close-call handlers
  const handleCloseCallFiltersChange = (newFilters: CloseCallFilters) => {
    setCloseCallFilters(newFilters);
  };

  const handleApplyCloseCallFilters = async (appliedFilters: CloseCallFilters) => {
    setIsFilterLoading(true);
    try {
      setAppliedCloseCallFilters(appliedFilters);
      setTableFilters({ severity: null, vehicleClass: null }); // Reset table filters on new data
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

  // Table filter handlers
  const handleSeverityFilter = (severity: string | null) => {
    setTableFilters(prev => ({ ...prev, severity }));
  };

  const handleVehicleClassFilter = (vehicleClass: string | null) => {
    setTableFilters(prev => ({ ...prev, vehicleClass }));
  };

  // Auto-refresh when Live Mode is enabled
  React.useEffect(() => {
    if (toggleState) {
      const interval = setInterval(() => {
        refetch();
        refetchAggregate();
        refetchCloseCalls(); 
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [toggleState, refetch, refetchAggregate, refetchCloseCalls]);

  const chartData = apiResponse || aggregateData;

  // Helper function to safely check if aggregate data has series
  const hasAggregateData = (): boolean => {
    return !!(aggregateData?.series && aggregateData.series.length > 0);
  };

  const renderMainDashboard = () => (
    <Grid container spacing={1}>
      <Grid size={{ xs: 15 }}>
        <KpiSummary data={kpiData} isLoading={isLoading} />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ width: '100%', height: 'fit-content', minHeight: 500 }}>
            <DashboardFileUpload 
              onUploadSuccess={() => {
                refetch();
              }}
            />
            <DashboardFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              isLoading={isFilterLoading}
            />
          </Box>
        </Grid>
        
        <Grid size={{ xs: 10, md: 9 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {hasAggregateData() && (
              <AggregateBox
                value={aggregateData!.series[0].value} // Safe to use ! here since we checked
                metric={filters.metric}
                bucket={aggregateData!.meta?.bucket || filters.time_bucket}
                isLoading={isAggregateLoading}
                error={aggregateError}
                objectClass={filters.object_class?.length === 1 ? filters.object_class[0] : undefined}
              />
            )}
            
            <ChartVisualization
              chartData={chartData}
              groupByFields={filters.group_by}
              metric={filters.metric}
              isLoading={isFilterLoading || isAggregateLoading}
              error={aggregateError}
              onChartTypeChange={setSelectedChartType}
              selectedChartType={selectedChartType}
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderCloseCallDashboard = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <CloseCallKpiSummary 
            data={closeCallKpiData} 
            isLoading={isCloseCallLoading} 
          />
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ width: '100%', height: 'fit-content' }}>
              <CloseCallFilter
                filters={closeCallFilters}
                onFiltersChange={handleCloseCallFiltersChange}
                onApply={handleApplyCloseCallFilters}
                onReset={handleResetCloseCallFilters}
                isLoading={isCloseCallLoading}
              />
              <Box sx={{ xs: 12, md: 3, mt: 3 }}>
                <CloseCallSummaryCards 
                  data={closeCallData}
                  isLoading={isCloseCallLoading}
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12, md: 9 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {closeCallFilters.include_details && (
                <CloseCallDetails
                  data={closeCallData}
                  isLoading={isCloseCallLoading}
                  onSeverityFilter={handleSeverityFilter}
                  onVehicleClassFilter={handleVehicleClassFilter}
                  onPageChange={handleCloseCallPageChange}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );

    const renderSafetyDashboard = () => (
      <Box sx={{ mt: 2 }}>
        <SafetyDashboard refreshCount={refreshCount} />
      </Box>
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar
          onRefresh={handleRefresh}
          onToggleChange={handleToggleChange}
          onNavigationChange={handleNavigationChange}
          toggleValue={toggleState}
          toggleLabel="Live Mode"
          activePath={activePage.path}
        />
        
        <Box component="main" sx={{ flex: 1, p: 4 }}>
          <Typography variant="h4" gutterBottom color="primary.main">
            {pageContent.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {pageContent.description}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {activePage.path === '/main' && renderMainDashboard()}
          {activePage.path === '/close-call' && renderCloseCallDashboard()}
          {activePage.path === '/safety' && renderSafetyDashboard()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;