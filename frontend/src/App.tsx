// src/App.tsx
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography } from '@mui/material';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import { useNavigation } from './hooks/useNavigation';
import NavBar from './components/NavBar';

function App() {
  const { 
    toggleState, 
    activePage,
    handleRefresh, 
    handleToggleChange, 
    handleNavigationChange,
    getPageContent 
  } = useNavigation();

  const pageContent = getPageContent();

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
          
          {/* You can add more content specific to each page */}
          {activePage.path === '/main' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Key Performance Indicators
              </Typography>
              <Typography>
                Overview of your main metrics and performance data.
              </Typography>
            </Box>
          )}
          
          {activePage.path === '/close-call' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Close-call Events
              </Typography>
              <Typography>
                Detailed analysis of recent near-miss incidents and preventive actions.
              </Typography>
            </Box>
          )}
          
          {activePage.path === '/safety' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Safety Compliance Overview
              </Typography>
              <Typography>
                Current safety compliance status and improvement recommendations.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;