import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ChartData, ChartType } from '../types/charts';
import { ChartConfigService } from '../services/chartConfigService';
import { ChartDataTransformer } from '../utils/chartDataTransformer';

// Register ChartJS components with date adapter
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartVisualizationProps {
  chartData: ChartData | null;
  groupByFields: string[];
  metric: string;
  isLoading?: boolean;
  error?: string | null;
  onChartTypeChange?: (chartType: ChartType) => void;
  selectedChartType?: ChartType;
}

const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  chartData,
  groupByFields,
  metric,
  isLoading = false,
  error = null,
  onChartTypeChange,
  selectedChartType,
}) => {
  const theme = useTheme();

  // Move helper functions BEFORE useMemo hooks
  const getYAxisLabel = (metricType: string): string => {
    const labels: Record<string, string> = {
      count: 'Count',
      unique_ids: 'Unique Objects',
      avg_speed: 'Speed (m/s)',
      rate: 'Rate (/hour)',
    };
    return labels[metricType] || 'Value';
  };

  const getXAxisLabel = (fields: string[]): string => {
    if (fields.length === 0) return 'Category';
    const primaryField = fields[0];
    const labels: Record<string, string> = {
      time_bucket: 'Time',
      object_class: 'Object Class',
      zone: 'Zone',
      vest: 'Safety Vest',
    };
    return labels[primaryField] || primaryField;
  };

  const { transformedData, chartConfig, availableChartTypes } = useMemo(() => {
    if (!chartData || !chartData.series || chartData.series.length === 0) {
      return { transformedData: null, chartConfig: null, availableChartTypes: [] };
    }

    const config = ChartConfigService.getChartConfig(groupByFields, metric);
    const availableTypes = ChartConfigService.getAvailableChartTypes(groupByFields);
    const transformedData = ChartDataTransformer.transform(chartData, groupByFields, metric);

    return {
      transformedData,
      chartConfig: config,
      availableChartTypes: availableTypes
    };
  }, [chartData, groupByFields, metric]);

const chartOptions = useMemo(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: chartConfig?.showLegend !== false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        callbacks: {
          // Custom tooltip for time series
          title: (context: any) => {
            if (groupByFields.includes('time_bucket')) {
              const value = context[0].label;
              const date = new Date(value);
              return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
            return context[0].label;
          }
        }
      },
    },
  };

  // For time-based charts, use time scale
  if (groupByFields.includes('time_bucket')) {
    return {
      ...baseOptions,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'hour' as const,
            tooltipFormat: 'MMM dd, HH:mm',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd',
            },
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: theme.palette.divider,
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            callback: function(value: any) {
              // Custom tick formatting for time axis
              const date = new Date(value);
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            }
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: getYAxisLabel(metric),
          },
          grid: {
            color: theme.palette.divider,
          },
        },
      },
    };
  }

  // For categorical charts
  return {
    ...baseOptions,
    scales: {
      x: {
        grid: {
          color: theme.palette.divider,
        },
        title: {
          display: true,
          text: getXAxisLabel(groupByFields),
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: getYAxisLabel(metric),
        },
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };
}, [chartConfig, groupByFields, metric, theme]);

  const renderChart = () => {
    if (!transformedData || !chartConfig) return null;

    const chartProps = {
      data: transformedData,
      options: chartOptions,
      height: 400,
    };

    const currentChartType = selectedChartType || chartConfig.type;

    // For time series data, only allow line or bar charts
    const effectiveChartType = groupByFields.includes('time_bucket') 
      ? (currentChartType === 'line' || currentChartType === 'bar' ? currentChartType : 'line')
      : currentChartType;

    switch (effectiveChartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  // Filter available chart types for time series data
  const getAvailableChartTypes = () => {
    if (groupByFields.includes('time_bucket')) {
      return ['line', 'bar'];
    }
    return availableChartTypes;
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography>Loading chart data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !transformedData) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography color="text.secondary">
              No data available for the selected filters
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={1}>
      <CardContent>
        {/* Chart Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            {chartConfig?.title}
          </Typography>
          
          {/* Chart Type Selector */}
          {getAvailableChartTypes().length > 1 && onChartTypeChange && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChartType || chartConfig?.type}
                label="Chart Type"
                onChange={(e) => onChartTypeChange(e.target.value as ChartType)}
              >
                {getAvailableChartTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Chart Container */}
        <Box sx={{ height: 400, position: 'relative' }}>
          {renderChart()}
        </Box>

        {/* Chart Metadata */}
        {chartData.meta && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Metric: {chartData.meta.metric} • Bucket: {chartData.meta.bucket}
              {chartData.meta.cached && ' • (Cached)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {transformedData.datasets.reduce((total, dataset) => 
                total + dataset.data.reduce((sum, value) => sum + value, 0), 0
              ).toLocaleString()} total records
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartVisualization;