// frontend/src/services/aggregateApi.ts
import ApiService from './api';

export interface ApiResponse<T> {
  series: T[];
  meta?: {
    metric: string;
    bucket: string;
    cached: boolean;
    cache_ttl?: number;
  };
}

export interface KpiData {
  value: number;
}

export interface AggregateQueryParams {
  group_by?: string | string[];
  metric?: string;
  entity?: string;
  object_class?: string | string[];
  time_bucket?: string;
  vest?: boolean;
  [key: string]: any;
}

class AggregateApiService extends ApiService {
  // Total count - ALL objects
  async getTotalCount(): Promise<number> {
    try {
      const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
        entity: 'objects',
        metric: 'count',
        group_by: 'id'
      });
      return data.series?.[0]?.value || 0;
    } catch (error) {
      return 0;
    }
  }

  // Human count
  async getHumanCount(): Promise<number> {
    try {
      const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
        entity: 'objects',
        metric: 'count',
        group_by: 'object_class',
        object_class: 'human'
      });
      return data.series?.[0]?.value || 0;
    } catch (error) {
      return 0;
    }
  }

  // Vehicle count
  async getVehicleCount(): Promise<number> {
    try {
      const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
        entity: 'objects', 
        metric: 'count',
        group_by: 'object_class',
        object_class: 'vehicle'
      });
      return data.series?.[0]?.value || 0;
    } catch (error) {
      return 0;
    }
  }

  // Vest violation count
  async getVestViolationCount(): Promise<number> {
    try {
      const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
        entity: 'objects',
        metric: 'count',
        group_by: 'object_class',
        object_class: 'human',
        vest: false
      });
      return data.series?.[0]?.value || 0;
    } catch (error) {
      return 0;
    }
  }

  // Generic aggregate method
  async getAggregateData(params: AggregateQueryParams): Promise<ApiResponse<KpiData>> {
    // Ensure entity is always included if not provided
    const cleanParams = {
      entity: 'objects', // Default entity
      ...params
    };
    
    // Clean up parameters
    if (Array.isArray(cleanParams.group_by)) {
      cleanParams.group_by = cleanParams.group_by.join(',');
    }
    
    if (Array.isArray(cleanParams.object_class) && cleanParams.object_class.length > 0) {
      cleanParams.object_class = cleanParams.object_class.join(',');
    } else if (Array.isArray(cleanParams.object_class) && cleanParams.object_class.length === 0) {
      delete cleanParams.object_class;
    }
    
    return this.get('kpi/aggregate/', cleanParams);
  }

  // Get all summary data in one call
  async getSummaryData(): Promise<{
    totalCount: number;
    humanCount: number;
    vehicleCount: number;
    vestViolationCount: number;
  }> {
    
    try {
      const [totalCount, humanCount, vehicleCount, vestViolationCount] = await Promise.all([
        this.getTotalCount(),
        this.getHumanCount(), 
        this.getVehicleCount(),
        this.getVestViolationCount(),
      ]);

      return {
        totalCount,
        humanCount,
        vehicleCount,
        vestViolationCount,
      };
    } catch (error) {
      return {
        totalCount: 0,
        humanCount: 0,
        vehicleCount: 0,
        vestViolationCount: 0,
      };
    }
  }
}

export const aggregateApiService = new AggregateApiService();