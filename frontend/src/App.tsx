import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Alert } from '@mui/material';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useApp } from './hooks/useApp';
import NavBar from './components/NavBar';
import MainDashboard from './components/dashboards/MainDashboard';
import CloseCallDashboard from './components/closecall/CloseCallDashboard';
import { SafetyDashboard } from './components/safety/SafetyDashboard';
import { AggregationFilters } from './types/filters';
import { CloseCallFilters } from './types/closeCall';

// Update App.tsx
function App() {
  const {
    // Navigation
    refreshCount,
    toggleState,
    activePage,
    handleRefresh,
    handleToggleChange,
    handleNavigationChange,
    getPageContent,
    
    // Error state
    error,
    
    // Close call dashboard
    closeCallKpiData,
    isCloseCallLoading,
    closeCallError,
    
    // Filters for all pages
    filters, // Main dashboard filters
    closeCallFilters, // Close-call filters
    appliedCloseCallFilters,
    
    // Filter handlers
    handleApplyFilters,
    handleApplyCloseCallFilters,
    // Add safety filter handlers when available
  } = useApp();

  const pageContent = getPageContent();

  // Handler for preset selection from any page
  const handlePresetSelect = (presetFilters: any, pageType: string) => {
    console.log('Applying preset for page:', pageType, presetFilters);
    
    switch (pageType) {
      case 'main':
        handleApplyFilters(presetFilters as AggregationFilters);
        break;
      case 'close-call':
        handleApplyCloseCallFilters(presetFilters as CloseCallFilters);
        break;
      case 'safety':
        // Add safety filter handler when available
        console.log('Safety preset applied:', presetFilters);
        // handleApplySafetyFilters(presetFilters); // Uncomment when you have safety filters
        break;
      default:
        console.warn('Unknown page type for preset:', pageType);
    }
  };

  // Get current filters based on active page
  const getCurrentFilters = () => {
    switch (activePage.path) {
      case '/main':
        return filters;
      case '/close-call':
        return appliedCloseCallFilters || closeCallFilters;
      case '/safety':
        return {}; // Return safety filters when available
      default:
        return filters;
    }
  };

  const renderDashboard = () => {
    switch (activePage.path) {
      case '/main':
        return <MainDashboard />;
      case '/close-call':
        return (
          <CloseCallDashboard
            kpiData={closeCallKpiData}
            isLoading={isCloseCallLoading}
            error={closeCallError}
          />
        );
      case '/safety':
        return <SafetyDashboard refreshCount={refreshCount} />;
      default:
        return <MainDashboard />;
    }
  };

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
          // Pass current filters and preset handler
          currentFilters={getCurrentFilters()}
          onPresetSelect={handlePresetSelect}
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
          
          {renderDashboard()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;