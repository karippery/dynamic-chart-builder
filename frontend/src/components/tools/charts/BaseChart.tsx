// frontend/src/components/charts/BaseChart.tsx
import React from 'react';
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
import { ChartData, ChartType } from '../../../types/charts';

// Register ChartJS components once
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

export interface BaseChartProps {
  title: string;
  chartData: ChartData | null;
  isLoading?: boolean;
  error?: string | null;
  onChartTypeChange?: (chartType: ChartType) => void;
  selectedChartType?: ChartType;
  availableChartTypes?: ChartType[];
  height?: number;
  children: React.ReactNode;
  metadata?: {
    metric?: string;
    bucket?: string;
    cached?: boolean;
    totalRecords?: number;
  };
}

export const BaseChart: React.FC<BaseChartProps> = ({
  title,
  chartData,
  isLoading = false,
  error = null,
  onChartTypeChange,
  selectedChartType,
  availableChartTypes = ['bar', 'line'],
  height = 400,
  children,
  metadata,
}) => {
  const theme = useTheme();

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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
            <Typography>Loading chart data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartData.series || chartData.series.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
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
            {title}
          </Typography>
          
          {/* Chart Type Selector */}
          {availableChartTypes.length > 1 && onChartTypeChange && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChartType || availableChartTypes[0]}
                label="Chart Type"
                onChange={(e) => onChartTypeChange(e.target.value as ChartType)}
              >
                {availableChartTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Chart Content */}
        <Box sx={{ height, position: 'relative' }}>
          {children}
        </Box>

        {/* Chart Metadata */}
        {metadata && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {metadata.metric && `Metric: ${metadata.metric}`}
              {metadata.bucket && ` • Bucket: ${metadata.bucket}`}
              {metadata.cached && ' • (Cached)'}
            </Typography>
            {metadata.totalRecords !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {metadata.totalRecords.toLocaleString()} total records
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};