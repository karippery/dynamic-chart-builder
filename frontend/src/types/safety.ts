export interface VestViolation {
  id: number;
  timestamp: string;
  tracking_id: string;
  x: number;
  y: number;
  zone: string;
}

export interface OverspeedEvent {
  id: number;
  timestamp: string;
  tracking_id: string;
  object_class: string;
  speed: number;
  speed_threshold: number;
  zone: string;
  x: number;
  y: number;
}

export interface VestViolationsResponse {
  total_count: number;
  parameters_used: {
    from_time: string | null;
    to_time: string | null;
    zone: string | null;
    page: number;
    page_size: number;
  };
  by_zone: Array<{
    zone: string;
    count: number;
  }>;
  statistics: {
    detections_processed: number;
    computation_time: string;
    total_zones_count: number;
    page_zones_count: number;
    page_violations_count: number;
    current_page_zones: string[];
  };
  vest_violations: VestViolation[];
  computed_at: string;
  pagination: {
    count: number;
    page: number;
    pages: number;
    page_size: number;
  };
}

export interface OverspeedEventsResponse {
  total_count: number;
  speed_threshold: number;
  parameters_used: {
    from_time: string | null;
    to_time: string | null;
    zone: string | null;
    speed_threshold: number;
    include_humans: boolean;
    object_class: string | null;
  };
  by_object_class: Array<{
    object_class: string;
    count: number;
  }>;
  statistics: {
    detections_processed: number;
    computation_time: string;
  };
  overspeed_events: OverspeedEvent[];
  computed_at: string;
  pagination: {
    count: number;
    page: number;
    pages: number;
    page_size: number;
  };
}

export interface SafetyFilters {
  from_time?: string;
  to_time?: string;
  zone?: string;
  page?: number;
  page_size?: number;
  time_bucket?: string;
  speed_threshold?: number;
  include_humans?: boolean;
  object_class?: string;
  force_refresh?: boolean;
  distance_threshold?: number;
  time_window_ms?: number;
  include_details?: boolean;
}

export type SafetyFiltersType = SafetyFilters;