import ApiService from './api';
import { 
  VestViolationsResponse, 
  OverspeedEventsResponse, 
  SafetyFilters 
} from '../types/safety';

class SafetyApiService extends ApiService {
  async getVestViolations(filters: SafetyFilters = {}): Promise<VestViolationsResponse> {
    return this.get<VestViolationsResponse>('kpi/vest-violations/', filters);
  }

  async getOverspeedEvents(filters: SafetyFilters = {}): Promise<OverspeedEventsResponse> {
    return this.get<OverspeedEventsResponse>('kpi/overspeed-events/', filters);
  }
}

export const safetyApiService = new SafetyApiService();