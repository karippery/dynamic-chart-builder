// frontend\src\components\SafetyFilters.tsx
import React from 'react';
import { Grid } from '@mui/material';
import { SafetyFiltersType } from '../../types/safety';
import BaseFilter from '../tools/filterbox/BaseFilter';
import { SelectFilter, SwitchFilter, TextFilter } from '../tools/filterbox/FilterFields';

interface SafetyFiltersProps {
  filters: SafetyFiltersType;
  onFiltersChange: (filters: SafetyFiltersType) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SafetyFilters: React.FC<SafetyFiltersProps> = (props) => {
  const { filters, onFiltersChange } = props;

  const handleFilterChange = (key: keyof SafetyFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters: SafetyFiltersType = {
    page: 1,
    time_bucket: '1h',
    distance_threshold: 2.0,
    time_window_ms: 5000,
    include_details: false,
    force_refresh: false
  };

  return (
    <BaseFilter 
      {...props}
      onApply={() => props.onApply()}
      title="Safety Filters"
      resetFilters={resetFilters}
    >
      {/* Time Range Filters */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="From Time"
          value={filters.from_time || ''}
          onChange={(value) => handleFilterChange('from_time', value)}
          type="datetime-local"
          placeholder="Start time"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="To Time"
          value={filters.to_time || ''}
          onChange={(value) => handleFilterChange('to_time', value)}
          type="datetime-local"
          placeholder="End time"
        />
      </Grid>

      {/* Zone and Object Class */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Zone"
          value={filters.zone || ''}
          onChange={(value) => handleFilterChange('zone', value)}
          placeholder="e.g., 9, 12"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Object Class"
          value={filters.object_class || ''}
          onChange={(value) => handleFilterChange('object_class', value)}
          placeholder="e.g., AGV, person, vehicle"
        />
      </Grid>

      {/* Time Configuration */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <SelectFilter
          label="Time Bucket"
          value={filters.time_bucket || '1h'}
          onChange={(value) => handleFilterChange('time_bucket', value)}
          options={[
            { value: '15m', label: '15 minutes' },
            { value: '1h', label: '1 hour' },
            { value: '4h', label: '4 hours' },
            { value: '1d', label: '1 day' },
          ]}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Time Window (ms)"
          value={filters.time_window_ms || 5000}
          onChange={(value) => handleFilterChange('time_window_ms', value)}
          type="number"
          inputProps={{ min: 1000, step: 1000 }}
        />
      </Grid>

      {/* Thresholds */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Distance Threshold"
          value={filters.distance_threshold || 2.0}
          onChange={(value) => handleFilterChange('distance_threshold', value)}
          type="number"
          inputProps={{ step: 0.1, min: 0 }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Speed Threshold (m/s)"
          value={filters.speed_threshold || 1.5}
          onChange={(value) => handleFilterChange('speed_threshold', value)}
          type="number"
          inputProps={{ step: 0.1, min: 0 }}
        />
      </Grid>

      {/* Switch Filters */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <SwitchFilter
          label="Include Details"
          checked={filters.include_details || false}
          onChange={(checked) => handleFilterChange('include_details', checked)}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <SwitchFilter
          label="Include Humans in Overspeed Monitoring"
          checked={filters.include_humans || false}
          onChange={(checked) => handleFilterChange('include_humans', checked)}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <SwitchFilter
          label="Force Refresh Cache"
          checked={filters.force_refresh || false}
          onChange={(checked) => handleFilterChange('force_refresh', checked)}
        />
      </Grid>
    </BaseFilter>
  );
};

export { SafetyFilters };