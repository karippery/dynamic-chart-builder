// frontend/src/App.tsx
import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Alert, Grid } from '@mui/material';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useNavigation } from './hooks/useNavigation';
import { useSumCardData } from './hooks/useSumCardData';
import NavBar from './components/NavBar';
import KpiSummary from './components/SumCardProps';
import DashboardFilter from './components/DashboardFilter';
import { AggregationFilters } from './types/filters';
import { filterApiService, FilterApiResponse } from './services/filterApi';
import { useAggregateData } from './hooks/useAggregateData';
import AggregateBox from './components/AggregateBox';
import ChartVisualization from './components/ChartVisualization';
import { ChartType } from './types/charts';

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
    group_by: ['time_bucket'], // Default grouping for chart
    time_bucket: '1h',
  });

  // Use aggregateData for BOTH aggregate box and default chart
  const { aggregateData, isLoading: isAggregateLoading, error: aggregateError, refetch: refetchAggregate } = useAggregateData(filters);

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<FilterApiResponse | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('bar');

  const pageContent = getPageContent();

  const handleFiltersChange = (newFilters: AggregationFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = async (appliedFilters: AggregationFilters) => {
    setIsFilterLoading(true);
    
    try {
      const response = await filterApiService.getFilteredData(appliedFilters);
      console.log('🎉 API Response:', response);
      setApiResponse(response);
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiResponse(null);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    console.log('Filters reset');
    setApiResponse(null);
  };

  // Auto-refresh when toggleState (Live Mode) is enabled
  React.useEffect(() => {
    if (toggleState) {
      const interval = setInterval(() => {
        refetch();
        refetchAggregate(); // Also refresh aggregate data
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [toggleState, refetch, refetchAggregate]);

  // Determine which data to use for chart
  // Use apiResponse when filters are applied, otherwise use aggregateData for default chart
  const chartData = apiResponse || aggregateData;

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
        
        <Box component="main" sx={{ flex: 1, p: 3 }}>
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
          
          {activePage.path === '/main' && (
            <Grid container spacing={2}>
              {/* Full-width KPI Summary */}
              <Grid size={{ xs: 15 }}>
                <KpiSummary data={kpiData} isLoading={isLoading} />
              </Grid>

              {/* Main Content Area - Side by Side */}
              <Grid container spacing={2}>
                {/* Filters - Left Column - Fixed height */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box 
                    sx={{ 
                      width: '100%',
                      height: 'fit-content',
                      minHeight: 500, // Match chart height
                    }}
                  >
                    <DashboardFilter
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      onApply={handleApplyFilters}
                      onReset={handleResetFilters}
                      isLoading={isFilterLoading}
                    />
                  </Box>
                </Grid>
                
                {/* Content - Right Column */}
                <Grid size={{ xs: 10, md: 9 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Aggregate Box */}
                    {aggregateData && aggregateData.series.length > 0 && (
                      <AggregateBox
                        value={aggregateData.series[0].value}
                        metric={filters.metric}
                        bucket={aggregateData.meta?.bucket || filters.time_bucket}
                        isLoading={isAggregateLoading}
                        error={aggregateError}
                        objectClass={filters.object_class && filters.object_class.length === 1 ? filters.object_class[0] : undefined}
                      />
                    )}
                    
                    {/* Chart Visualization */}
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
          )}
          
          {/* Other pages */}
          {activePage.path === '/close-call' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                Close-call Analysis
              </Typography>
              <Typography variant="body1" paragraph>
                Detailed analysis of recent near-miss incidents and preventive actions.
                Track safety events and identify potential risks before they escalate.
              </Typography>
              <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Close-call analytics and incident reports will be displayed here.
                </Typography>
              </Box>
            </Box>
          )}
          
          {activePage.path === '/safety' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                Safety Metrics
              </Typography>
              <Typography variant="body1" paragraph>
                Comprehensive safety performance indicators and compliance tracking.
                View safety reports, incident trends, and improvement recommendations.
              </Typography>
              <Box sx={{ mt: 3, p: 3, backgroundColor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Safety compliance metrics and reports will be displayed here.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;