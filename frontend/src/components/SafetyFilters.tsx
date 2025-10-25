
import React from 'react';
import { Grid } from '@mui/material';
import { SafetyFiltersType } from '../types/safety';
import BaseFilter from './tools/filterbox/BaseFilter';
import { SelectFilter, SwitchFilter, TextFilter } from './tools/filterbox/FilterFields';

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
    page_size: 10,
    time_bucket: '1h'
  };

  return (
    <BaseFilter 
      {...props}
      onApply={() => props.onApply()}
      title="Safety Filters"
      resetFilters={resetFilters}
    >
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Zone"
          value={filters.zone || ''}
          onChange={(value) => handleFilterChange('zone', value)}
          placeholder="e.g., 9, 12"
        />
      </Grid>

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
          label="Speed Threshold (m/s)"
          value={filters.speed_threshold || 1.5}
          onChange={(value) => handleFilterChange('speed_threshold', value)}
          type="number"
          inputProps={{ step: 0.1, min: 0 }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Object Class"
          value={filters.object_class || ''}
          onChange={(value) => handleFilterChange('object_class', value)}
          placeholder="e.g., AGV"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextFilter
          label="Page Size"
          value={filters.page_size || 10}
          onChange={(value) => handleFilterChange('page_size', value)}
          type="number"
          inputProps={{ min: 1, max: 100 }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
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