import React from 'react';
import { Grid, Box } from '@mui/material';
import { useApp } from '../../hooks/useApp';
import KpiSummary from '../tools/kpiCard/KpiSummary';
import DashboardFilter from '../aggregate/AggregateFilter';
import AggregateBox from '../aggregate/AggregateBox';
import ChartVisualization from '../aggregate/AggregateChart';
import DashboardFileUpload from '../aggregate/AggregateFileUpload';

const MainDashboard: React.FC = () => {
  const {
    kpiData,
    isLoading,
    filters,
    aggregateData,
    isAggregateLoading,
    aggregateError,
    handleFiltersChange,
    handleApplyFilters,
    handleResetFilters,
    isFilterLoading
  } = useApp();

  const hasAggregateData = aggregateData?.series && aggregateData.series.length > 0;

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 15 }}>
        <KpiSummary data={kpiData} isLoading={isLoading} />
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ width: '100%', height: 'fit-content', minHeight: 500 }}>
            <DashboardFileUpload onUploadSuccess={() => {}} />
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
            {hasAggregateData && (
              <AggregateBox
                value={aggregateData.series[0].value}
                metric={filters.metric}
                bucket={aggregateData.meta?.bucket || filters.time_bucket}
                isLoading={isAggregateLoading}
                error={aggregateError}
                objectClass={filters.object_class?.length === 1 ? filters.object_class[0] : undefined}
              />
            )}
            
            <ChartVisualization
              chartData={aggregateData}
              groupByFields={filters.group_by}
              metric={filters.metric}
              isLoading={isFilterLoading || isAggregateLoading}
              error={aggregateError}
              onChartTypeChange={() => {}}
              selectedChartType="bar"
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MainDashboard;