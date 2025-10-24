export interface ChartData {
  series: Array<{
    [key: string]: any;
    value: number;
    time?: string;
    class?: string;
    zone?: string;
    vest?: boolean;
  }>;
  meta?: {
    metric: string;
    bucket: string;
    cached: boolean;
    cache_ttl?: number;
  };
}

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'polarArea';

export interface ChartConfig {
  type: ChartType;
  title: string;
  colors: string[];
  showLegend: boolean;
  responsive: boolean;
}

export interface GroupByConfig {
  type: 'time' | 'category' | 'boolean';
  field: string;
  label: string;
  chartTypes: ChartType[];
  defaultChartType: ChartType;
}