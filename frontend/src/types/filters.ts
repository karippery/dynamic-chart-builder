// frontend/src/types/filters.ts
export interface AggregationFilters {
  // Basic Parameters
  metric: 'count' | 'unique_ids' | 'avg_speed' | 'rate';
  entity: 'events' | 'objects' | '';
  group_by: string[];
  time_bucket: '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '';
  
  // Filter Parameters
  object_class?: string[];
  vest?: boolean;
  from_time?: string;
  to_time?: string;
  min_speed?: number;
  max_speed?: number;
  min_x?: number;
  max_x?: number;
  min_y?: number;
  max_y?: number;
  zone?: string;
  
  // Advanced filters
  [key: string]: any;
}

export interface FilterSectionProps {
  filters: AggregationFilters;
  onFiltersChange: (filters: AggregationFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}