export interface CloseCallFilters {
  from_time?: string;
  to_time?: string;
  distance_threshold?: number;
  time_window_ms?: number;
  object_class?: string;
  zone?: string;
  include_details?: boolean;
  force_refresh?: boolean;
  time_bucket?: string;
}

export interface CloseCallResponse {
  total_count: number;
  parameters_used: {
    distance_threshold: number;
    time_window_ms: number;
    from_time?: string;
    to_time?: string;
    vehicle_class?: string;
  };
  by_vehicle_class: Record<string, number>;
  by_severity: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  time_series: Array<{
    time: string;  // CORRECT: Backend uses 'time' not 'timestamp'
    count: number;
  }>;
  close_calls: CloseCallDetail[];
  statistics: {
    human_detections_processed: number;
    vehicle_detections_processed: number;
    close_calls_detected: number;
    time_window_used_ms: number;
  };
  computed_at: string;
  include_details: boolean;
  cache_metadata?: {
    cached: boolean;
    cache_key: string;
    served_from_cache: boolean;
  };
}

export interface CloseCallDetail {
  timestamp: string;
  human_tracking_id: string;
  human_x: number;
  human_y: number;
  human_zone: string | null;
  vehicle_tracking_id: string;
  vehicle_class: string;
  vehicle_x: number;
  vehicle_y: number;
  vehicle_zone: string | null;
  distance: number;
  distance_threshold: number;
  time_window_ms: number;
  time_difference_ms: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CloseCallKpiData {
  totalCloseCalls: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  humanDetections: number;
  vehicleDetections: number;
  detectionRate: number;
}

// frontend/src/types/closeCall.ts - Add these interfaces

export interface CloseCallDetailsResponse {
  close_calls: CloseCallDetail[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  computed_at: string;
}

export interface CloseCallDetailsFilters {
  page?: number;
  page_size?: number;
  severity?: string | null;
  vehicle_class?: string | null;
  from_time?: string;
  to_time?: string;
}