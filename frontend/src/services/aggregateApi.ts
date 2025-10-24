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
  group_by?: string;
  metric?: string;
  object_class?: 'human' | 'vehicle';
  vest?: boolean;
  [key: string]: string | number | boolean | undefined;
}

class AggregateApiService extends ApiService {
  // Remove the useless constructor - it's not needed
  // The parent class constructor will be used automatically

  // Total count
  async getTotalCount(): Promise<number> {
    const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
      group_by: 'id',
      metric: 'count'
    });
    return data.series[0]?.value || 0;
  }

  // Human count
  async getHumanCount(): Promise<number> {
    const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
      group_by: 'id',
      metric: 'count',
      object_class: 'human'
    });
    return data.series[0]?.value || 0;
  }

  // Vehicle count
  async getVehicleCount(): Promise<number> {
    const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
      group_by: 'id',
      metric: 'count',
      object_class: 'vehicle'
    });
    return data.series[0]?.value || 0;
  }

  // Vest violation count
  async getVestViolationCount(): Promise<number> {
    const data: ApiResponse<KpiData> = await this.get('kpi/aggregate/', {
      group_by: 'id',
      metric: 'count',
      object_class: 'human',
      vest: false
    });
    return data.series[0]?.value || 0;
  }

  // Generic aggregate method
  async getAggregateData(params: AggregateQueryParams): Promise<ApiResponse<KpiData>> {
    return this.get('kpi/aggregate/', params);
  }

  // Get all summary data in one call
  async getSummaryData(): Promise<{
    totalCount: number;
    humanCount: number;
    vehicleCount: number;
    vestViolationCount: number;
  }> {
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
  }
}

export const aggregateApiService = new AggregateApiService();