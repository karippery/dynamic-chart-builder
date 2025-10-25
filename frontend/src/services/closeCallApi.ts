import ApiService from './api';
import { CloseCallFilters, CloseCallResponse } from '../types/closeCall';

class CloseCallApiService extends ApiService {
  async getCloseCalls(filters: CloseCallFilters): Promise<CloseCallResponse> {
    // Clean up undefined values
    const cleanFilters: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanFilters[key] = value;
      }
    });

    

    return this.get<CloseCallResponse>('kpi/close-calls', cleanFilters);
  }
}

export const closeCallApiService = new CloseCallApiService();