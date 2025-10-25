import React from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { useApp } from '../../hooks/useApp';
import CloseCallDetails from './CloseCallDetails';
import CloseCallKpiSummary from './CloseCallKpiSummary';
import CloseCallFilter from './CloseCallFilter';
import CloseCallSummaryCards from './CloseCallSummaryCards';

interface CloseCallDashboardProps {
  kpiData: any;
  isLoading: boolean;
  error?: string | null;
}

const CloseCallDashboard: React.FC<CloseCallDashboardProps> = ({
  kpiData,
  isLoading,
  error
}) => {
  const {
    closeCallData,
    closeCallFilters,
    appliedCloseCallFilters,
    isCloseCallLoading,
    handleCloseCallFiltersChange,
    handleApplyCloseCallFilters,
    handleResetCloseCallFilters,
    handleCloseCallPageChange,
    handleSeverityFilter,
    handleVehicleClassFilter
  } = useApp();

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <CloseCallKpiSummary 
            data={kpiData} 
            isLoading={isLoading} 
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
              {appliedCloseCallFilters.include_details && (
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
};

export default CloseCallDashboard;