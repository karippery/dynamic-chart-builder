import { ChartConfig, ChartType, GroupByConfig } from '../types/charts';

export class ChartConfigService {
  private static groupByConfigs: Record<string, GroupByConfig> = {
    time_bucket: {
      type: 'time',
      field: 'time',
      label: 'Time',
      chartTypes: ['line', 'bar'],
      defaultChartType: 'line'
    },
    object_class: {
      type: 'category',
      field: 'class',
      label: 'Object Class',
      chartTypes: ['bar', 'pie', 'doughnut'],
      defaultChartType: 'bar'
    },
    zone: {
      type: 'category',
      field: 'zone',
      label: 'Zone',
      chartTypes: ['bar', 'pie', 'doughnut'],
      defaultChartType: 'bar'
    },
    vest: {
      type: 'boolean',
      field: 'vest',
      label: 'Safety Vest',
      chartTypes: ['pie', 'doughnut', 'bar'],
      defaultChartType: 'pie'
    }
  };

  static getChartConfig(groupByFields: string[], metric: string): ChartConfig {
    const primaryGroup = groupByFields[0];
    const config = this.groupByConfigs[primaryGroup] || this.groupByConfigs.time_bucket;
    
    return {
      type: config.defaultChartType,
      title: this.generateChartTitle(groupByFields, metric),
      colors: this.getColorScheme(primaryGroup),
      showLegend: groupByFields.length > 0,
      responsive: true
    };
  }

  static getAvailableChartTypes(groupByFields: string[]): ChartType[] {
    const primaryGroup = groupByFields[0];
    const config = this.groupByConfigs[primaryGroup];
    
    if (!config) return ['bar', 'line'];
    
    // For multiple group by, prefer bar charts
    if (groupByFields.length > 1) {
      return ['bar'];
    }
    
    return config.chartTypes;
  }

  private static generateChartTitle(groupByFields: string[], metric: string): string {
    const metricLabels: Record<string, string> = {
      count: 'Count',
      unique_ids: 'Unique Objects',
      avg_speed: 'Average Speed',
      rate: 'Rate'
    };

    const groupLabels = groupByFields.map(field => 
      this.groupByConfigs[field]?.label || field
    ).join(' & ');

    return `${metricLabels[metric] || metric} by ${groupLabels || 'Time'}`;
  }

  private static getColorScheme(groupBy: string): string[] {
    const colorSchemes: Record<string, string[]> = {
      time_bucket: [
        '#09039A', '#3D36B0', '#6A63C6', '#8F88DC', '#B5AFF2'
      ],
      object_class: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'
      ],
      zone: [
        '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94'
      ],
      vest: [
        '#4CAF50', '#F44336' // Green for true, Red for false
      ]
    };

    return colorSchemes[groupBy] || [
      '#09039A', '#3D36B0', '#6A63C6', '#8F88DC', '#B5AFF2'
    ];
  }

  static getGroupByConfig(field: string): GroupByConfig | undefined {
    return this.groupByConfigs[field];
  }
}