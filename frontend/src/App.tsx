import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Alert } from '@mui/material';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useNavigation } from './hooks/useNavigation';
import { useSumCardData } from './hooks/useSumCardData';
import NavBar from './components/NavBar';
import KpiSummary from './components/SumCardProps'; // Import the KpiSummary component

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
  
  const pageContent = getPageContent();

  // Auto-refresh when toggleState (Live Mode) is enabled
  React.useEffect(() => {
    if (toggleState) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds in live mode

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
        
        {/* Main content area */}
        <Box component="main" sx={{ flex: 1, p: 3 }}>
          <Typography variant="h4" gutterBottom color="primary.main">
            {pageContent.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {pageContent.description}
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* KPI Summary Section - Show ONLY on main page */}
          {activePage.path === '/main' && (
            <KpiSummary data={kpiData} isLoading={isLoading} />
          )}
          
          
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