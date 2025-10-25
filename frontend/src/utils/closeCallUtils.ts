import { ChipProps } from '@mui/material';
import { CloseCallFilters } from '../types/closeCall';

export const getSeverityColor = (severity: string): ChipProps['color'] => {
  switch (severity) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'default';
  }
};

export const formatCloseCallTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

// Define constants outside the function
const DEFAULT_CLOSE_CALL_FILTERS: CloseCallFilters = {
  distance_threshold: 2.0,
  time_window_ms: 250,
  include_details: true,
  time_bucket: '1h',
};

const RESET_CLOSE_CALL_FILTERS: CloseCallFilters = {
  distance_threshold: 0,
  time_window_ms: 0,
  include_details: true,
  time_bucket: '',
};

// Export functions that return copies of the constants
export const getDefaultCloseCallFilters = (): CloseCallFilters => ({
  ...DEFAULT_CLOSE_CALL_FILTERS,
});

export const getResetCloseCallFilters = (): CloseCallFilters => ({
  ...RESET_CLOSE_CALL_FILTERS,
});


export const cleanFilters = (filters: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      clean[key] = value;
    }
  });
  return clean;
};


