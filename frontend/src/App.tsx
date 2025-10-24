// frontend/src/App.tsx
import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Alert, Grid } from '@mui/material'; // Grid is Grid2 in v5.15+
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useNavigation } from './hooks/useNavigation';
import { useSumCardData } from './hooks/useSumCardData';
import NavBar from './components/NavBar';
import KpiSummary from './components/SumCardProps';
import DashboardFilter from './components/DashboardFilter';
import { AggregationFilters } from './types/filters';
import { filterApiService, FilterApiResponse } from './services/filterApi'; // Add this import
import { useAggregateData } from './hooks/useAggregateData';
import AggregateBox from './components/AggregateBox';

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
    group_by: [],
    time_bucket: '1h',
  });
  const {aggregateData, 
  isLoading: isAggregateLoading, 
  error: aggregateError } = useAggregateData(filters);

  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<FilterApiResponse | null>(null); // Add this state

  const pageContent = getPageContent();

  const handleFiltersChange = (newFilters: AggregationFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = async (appliedFilters: AggregationFilters) => {
    setIsFilterLoading(true);
    
    try {
      const response = await filterApiService.getFilteredData(appliedFilters);
      console.log('🎉 API Response:', response);
      setApiResponse(response); // Store API response
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiResponse(null);
    } finally {
      setIsFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    console.log('Filters reset');
    setApiResponse(null); // Clear API response on reset
  };

  React.useEffect(() => {
    if (toggleState) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [toggleState, refetch]);

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
            <Grid container spacing={3}>
              {/* Full-width KPI Summary */}
              <Grid size={{ xs: 12 }}>
                <KpiSummary data={kpiData} isLoading={isLoading} />
              </Grid>

              {/* Nested Grid for Filters + Content */}
              <Grid container spacing={3} sx={{ mt: 0 }}>
                {/* Filters - Left Side */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box 
                    sx={{ 
                      width: { xs: '100%', md: 280 },
                      position: { md: 'sticky' },
                      top: { md: 100 },
                      maxHeight: { md: 'calc(100vh - 140px)' },
                      overflowY: { md: 'auto' },
                      '&::-webkit-scrollbar': { width: '8px' },
                      '&::-webkit-scrollbar-track': { backgroundColor: 'background.default' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'primary.light',
                        borderRadius: '4px',
                      },
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
                
                {/* Main Content - Right Side */}
                <Grid size={{ xs: 12, md: 9 }}>
                  <Box sx={{ mt: 0 }}>
                    {/* Aggregate Box - Added here */}
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
                    <Typography variant="h6" gutterBottom>
                      Filtered Data Visualization
                    </Typography>
                    <Box sx={{ p: 3, backgroundColor: 'background.default', borderRadius: 1, minHeight: 400 }}>
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Charts and visualizations based on current filters will be displayed here.
                        Current filters: {JSON.stringify(filters, null, 2)}
                      </Typography>
                      
                      {/* Add API Response Display */}
                      {apiResponse && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            📊 API Response Data:
                          </Typography>
                          <Typography variant="body2" component="pre" sx={{ 
                            backgroundColor: 'grey.100', 
                            p: 2, 
                            borderRadius: 1,
                            overflow: 'auto',
                            fontSize: '0.75rem',
                            maxHeight: 200 
                          }}>
                            {JSON.stringify(apiResponse.series, null, 2)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
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