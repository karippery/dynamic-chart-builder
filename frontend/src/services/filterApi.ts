// frontend/src/services/filterApi.ts
import ApiService from './api';
import { AggregationFilters } from '../types/filters';

export interface FilterApiResponse {
  series: Array<{
    [key: string]: any;
    value: number;
  }>;
  meta?: {
    metric: string;
    bucket: string;
    cached: boolean;
    cache_ttl?: number;
  };
}

class FilterApiService extends ApiService {
  
  async getFilteredData(filters: AggregationFilters): Promise<FilterApiResponse> {
    // Convert filters to API parameters
    const params = this.convertFiltersToParams(filters);
    try {
      const response = await this.get('kpi/aggregate/', params);
      return response as FilterApiResponse;
    } catch (error) {
      throw error;
    }
  }

    private convertFiltersToParams(filters: AggregationFilters): Record<string, any> {
    const params: Record<string, any> = {
        metric: filters.metric,
    };

    // For entity - since it's required in the interface, we always include it
    // but you can check if you want to exclude it for some reason
    params.entity = filters.entity;

    // For time_bucket - check if it's the default or empty
    // Since time_bucket is required, we might want to always include it
    params.time_bucket = filters.time_bucket;

    // Handle group_by - only include if not empty array
    if (filters.group_by && filters.group_by.length > 0) {
        params.group_by = filters.group_by.join(',');
    }

    // Handle object_class - only include if not empty array
    if (filters.object_class && filters.object_class.length > 0) {
        params.object_class = filters.object_class.join(',');
    }

    // Handle vest - only include if explicitly set (not undefined)
    if (filters.vest !== undefined) {
        params.vest = filters.vest;
    }

    // Handle date filters
    if (filters.from_time) {
        params.from = filters.from_time;
    }
    if (filters.to_time) {
        params.to = filters.to_time;
    }

    // Handle numeric filters
    if (filters.min_speed !== undefined) {
        params.min_speed = filters.min_speed;
    }
    if (filters.max_speed !== undefined) {
        params.max_speed = filters.max_speed;
    }

    if (filters.min_x !== undefined) {
        params.min_x = filters.min_x;
    }
    if (filters.max_x !== undefined) {
        params.max_x = filters.max_x;
    }

    if (filters.min_y !== undefined) {
        params.min_y = filters.min_y;
    }
    if (filters.max_y !== undefined) {
        params.max_y = filters.max_y;
    }

    // Handle zone
    if (filters.zone) {
        params.zone = filters.zone;
    }
    return params;
    }
}

export const filterApiService = new FilterApiService();