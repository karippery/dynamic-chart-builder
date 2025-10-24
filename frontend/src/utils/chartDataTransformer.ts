import { ChartData } from '../types/charts';
import { ChartConfigService } from '../services/chartConfigService';
import theme from '../theme/theme';

export interface TransformedChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
    // Add Chart.js point styling properties
    pointBackgroundColor?: string[];
    pointBorderColor?: string;
    pointBorderWidth?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
}

export class ChartDataTransformer {
  static transform(data: ChartData, groupByFields: string[], metric: string): TransformedChartData {
    if (!data.series || data.series.length === 0) {
      return { labels: [], datasets: [] };
    }

    const config = ChartConfigService.getChartConfig(groupByFields, metric);
    const primaryGroup = groupByFields[0];

    if (groupByFields.length === 1) {
      return this.transformSingleGroup(data, primaryGroup, config);
    } else {
      return this.transformMultipleGroups(data, groupByFields, config);
    }
  }

private static transformSingleGroup(
  data: ChartData, 
  groupBy: string, 
  config: any
): TransformedChartData {
  const groupConfig = ChartConfigService.getGroupByConfig(groupBy);
  const field = groupConfig?.field || groupBy;

  // For time buckets, ensure proper date handling
  if (groupBy === 'time_bucket') {
    const labels = data.series.map(item => {
      const date = new Date(item[field]);
      return isNaN(date.getTime()) ? String(item[field]) : date.toISOString();
    });
    
    const values = data.series.map(item => item.value);
    const colors = config.colors.slice(0, data.series.length);

    return {
      labels,
      datasets: [{
        label: this.getDatasetLabel(groupBy, data.meta?.metric),
        data: values,
        backgroundColor: colors,
        borderColor: config.type === 'line' ? colors.map((color: string) => color) : undefined,
        borderWidth: config.type === 'line' ? 2 : 1,
        // For time series, use point background color
        pointBackgroundColor: colors,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  }

  // Original implementation for non-time data
  const labels = data.series.map(item => this.formatLabel(item[field], groupBy));
  const values = data.series.map(item => item.value);
  const colors = config.colors.slice(0, data.series.length);

  return {
    labels,
    datasets: [{
      label: this.getDatasetLabel(groupBy, data.meta?.metric),
      data: values,
      backgroundColor: colors,
      borderColor: config.type === 'line' ? colors.map((color: string) => color) : undefined,
      borderWidth: config.type === 'line' ? 2 : 1
    }]
  };
}

  private static transformMultipleGroups(
    data: ChartData, 
    groupByFields: string[], 
    config: any
  ): TransformedChartData {
    // For multiple groups, we'll create a stacked bar chart
    const primaryGroup = groupByFields[0];
    const secondaryGroup = groupByFields[1];
    
    // Alternative to [...new Set()] - using Array.from
    const primaryValues = Array.from(new Set(data.series.map(item => item[primaryGroup])));
    const secondaryValues = Array.from(new Set(data.series.map(item => item[secondaryGroup])));

    const labels = primaryValues.map(val => this.formatLabel(val, primaryGroup));
    
    const datasets = secondaryValues.map((secondaryVal: any, index: number) => {
      const datasetData = primaryValues.map((primaryVal: any) => {
        const item = data.series.find(
          (s: any) => s[primaryGroup] === primaryVal && s[secondaryGroup] === secondaryVal
        );
        return item ? item.value : 0;
      });

      return {
        label: this.formatLabel(secondaryVal, secondaryGroup),
        data: datasetData,
        backgroundColor: config.colors[index % config.colors.length],
        borderColor: config.colors[index % config.colors.length],
        borderWidth: 1
      };
    });

    return { labels, datasets };
  }

  // Alternative implementation without Set (more compatible)
  private static getUniqueValues(items: any[], field: string): any[] {
    const uniqueMap: Record<string, boolean> = {};
    const result: any[] = [];
    
    items.forEach((item: any) => {
      const value = item[field];
      const key = String(value);
      if (!uniqueMap[key]) {
        uniqueMap[key] = true;
        result.push(value);
      }
    });
    
    return result;
  }

private static formatLabel(value: any, groupBy: string): string {
  if (value === undefined || value === null) return 'Unknown';
  
  switch (groupBy) {
    case 'time_bucket':
      // Handle both ISO strings with timezone and Date objects
      const date = new Date(value);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return String(value);
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    case 'vest':
      return value ? 'Vest Required' : 'No Vest';
    default:
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }
}

  private static getDatasetLabel(groupBy: string, metric?: string): string {
    const metricLabels: Record<string, string> = {
      count: 'Count',
      unique_ids: 'Unique Objects',
      avg_speed: 'Speed (m/s)',
      rate: 'Rate (/hour)'
    };

    const groupLabels: Record<string, string> = {
      time_bucket: 'Time',
      object_class: 'Object Class',
      zone: 'Zone',
      vest: 'Safety Vest'
    };

    return `${metricLabels[metric || 'count']} by ${groupLabels[groupBy] || groupBy}`;
  }
}