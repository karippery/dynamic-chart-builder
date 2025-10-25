import React, { useState } from 'react';
import {
  Box,
  Grid,
  Alert,
  Typography,
  Paper
} from '@mui/material';
import { Warning, Speed, Assessment, Timeline } from '@mui/icons-material';
import { SafetyFiltersType } from '../../types/safety';
import { useSafetyData } from '../../hooks/useSafetyData';
import { SafetySummaryCard } from './SafetySummaryCard';
import { SafetyCharts } from './SafetyCharts';
import { SafetyDataTable } from './SafetyDataTable';
import { SafetyFilters } from './SafetyFilters';

interface SafetyDashboardProps {
  refreshCount: number;
}

export const SafetyDashboard: React.FC<SafetyDashboardProps> = ({ refreshCount }) => {
  const [filters, setFilters] = useState<SafetyFiltersType>({
    page: 1,
    page_size: 10,
    time_bucket: '1h',
    speed_threshold: 1.5,
    include_humans: false
  });

  const [appliedFilters, setAppliedFilters] = useState<SafetyFiltersType>(filters);

  const { vestViolations, overspeedEvents, isLoading, error, refetch } = useSafetyData(appliedFilters, refreshCount);

  const handleApplyFilters = (appliedFilters: SafetyFiltersType) => {
    console.log('Applying filters in dashboard:', appliedFilters);
    setAppliedFilters(appliedFilters);
    // The useSafetyData hook will automatically refetch when appliedFilters changes
  };

  const handleResetFilters = () => {
    console.log('Resetting filters in dashboard');
    const defaultFilters: SafetyFiltersType = {
      page: 1,
      page_size: 10,
      time_bucket: '1h',
      distance_threshold: 2.0,
      time_window_ms: 5000,
      include_details: false,
      force_refresh: false,
      speed_threshold: 1.5,
      include_humans: false
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    // The useSafetyData hook will automatically refetch when appliedFilters changes
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SafetyFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isLoading={isLoading}
          />
        </Grid>

        {/* Summary Cards */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SafetySummaryCard
                title="Total Vest Violations"
                value={vestViolations?.total_count || 0}
                icon={<Warning />}
                color="error"
                isLoading={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SafetySummaryCard
                title="Overspeed Events"
                value={overspeedEvents?.total_count || 0}
                icon={<Speed />}
                color="warning"
                isLoading={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SafetySummaryCard
                title="Active Zones"
                value={vestViolations?.statistics?.total_zones_count || 0}
                subtitle="With violations"
                icon={<Assessment />}
                color="info"
                isLoading={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SafetySummaryCard
                title="Detections Processed"
                value={vestViolations?.statistics?.detections_processed || 0}
                icon={<Timeline />}
                color="success"
                isLoading={isLoading}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Box sx={{ mt: 3 }}>
            <SafetyCharts
              vestViolations={vestViolations}
              overspeedEvents={overspeedEvents}
              isLoading={isLoading}
              objectClassFilter={appliedFilters.object_class} // Pass the applied filter here
            />
          </Box>
        </Grid>
      </Grid>

      {/* Data Tables */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SafetyDataTable
            title="Recent Vest Violations"
            data={vestViolations?.vest_violations || []}
            type="vest-violations"
            isLoading={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SafetyDataTable
            title="Recent Overspeed Events"
            data={overspeedEvents?.overspeed_events || []}
            type="overspeed-events"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Statistics */}
      {(vestViolations || overspeedEvents) && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Grid container spacing={2}>
            {vestViolations && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Vest Violations computed at: {new Date(vestViolations.computed_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Computation time: {vestViolations.statistics.computation_time}
                </Typography>
              </Grid>
            )}
            {overspeedEvents && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Overspeed Events computed at: {new Date(overspeedEvents.computed_at).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Speed threshold: {overspeedEvents.speed_threshold}m/s
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};