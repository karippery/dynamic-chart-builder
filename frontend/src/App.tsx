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
    closeCallError
  } = useApp();

  const pageContent = getPageContent();

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