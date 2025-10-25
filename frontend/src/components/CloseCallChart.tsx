import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { CloseCallResponse } from '../types/closeCall';
import ChartVisualization from './ChartVisualization';
import { ChartType } from '../types/charts';

interface CloseCallChartProps {
  data: CloseCallResponse | null;
  timeBucket: string;
  isLoading?: boolean;
  error?: string | null;
  selectedSeverity?: string | null;
  selectedVehicleClass?: string | null;
  timeRange?: { start: string; end: string };
}

export const CloseCallChart: React.FC<CloseCallChartProps> = ({
  data,
  timeBucket,
  isLoading = false,
  error = null,
  selectedSeverity = null,
  selectedVehicleClass = null,
  timeRange,
}) => {
  const [selectedChartType, setSelectedChartType] = React.useState<ChartType>('bar');

  const chartData = React.useMemo(() => {
    if (!data?.close_calls) return null;

    // Filter close calls based on current table view
    let filteredCalls = data.close_calls;
    
    if (selectedSeverity) {
      filteredCalls = filteredCalls.filter(call => call.severity === selectedSeverity);
    }
    
    if (selectedVehicleClass) {
      filteredCalls = filteredCalls.filter(call => call.vehicle_class === selectedVehicleClass);
    }
    
    if (timeRange) {
      filteredCalls = filteredCalls.filter(call => {
        const callTime = new Date(call.timestamp);
        return callTime >= new Date(timeRange.start) && callTime <= new Date(timeRange.end);
      });
    }

    if (filteredCalls.length === 0) return null;

    // Time distribution of filtered data
    const timeCounts: Record<string, number> = {};
    filteredCalls.forEach(call => {
      const timeKey = call.timestamp.slice(0, 16); // "YYYY-MM-DDTHH:MM"
      timeCounts[timeKey] = (timeCounts[timeKey] || 0) + 1;
    });

    return {
      series: Object.entries(timeCounts).map(([time, count]) => ({
        timestamp: time,
        value: count,
        group_by: { time_bucket: time },
      })),
      meta: {
        metric: 'count',
        bucket: timeBucket,
        cached: data.cache_metadata?.served_from_cache || false,
        filtered: filteredCalls.length !== data.close_calls.length,
        filterInfo: {
          severity: selectedSeverity,
          vehicleClass: selectedVehicleClass,
        },
      },
    };
  }, [data, timeBucket, selectedSeverity, selectedVehicleClass, timeRange]);

  const totalInView = chartData?.series.reduce((sum, item) => sum + item.value, 0) || 0;

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            Close Call Summary
            {selectedSeverity && (
              <Chip 
                label={`Severity: ${selectedSeverity}`} 
                size="small" 
                sx={{ ml: 1 }}
                color="primary"
                variant="outlined"
              />
            )}
            {selectedVehicleClass && (
              <Chip 
                label={`Vehicle: ${selectedVehicleClass}`} 
                size="small" 
                sx={{ ml: 1 }}
                color="secondary"
                variant="outlined"
              />
            )}
          </Typography>
        </Box>

        <ChartVisualization
          chartData={chartData}
          groupByFields={['time_bucket']}
          metric="count"
          isLoading={isLoading}
          error={error}
          onChartTypeChange={setSelectedChartType}
          selectedChartType={selectedChartType}
        />
        
        {chartData && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Showing {chartData.series.length} time buckets
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total in view: {totalInView} close calls
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CloseCallChart;