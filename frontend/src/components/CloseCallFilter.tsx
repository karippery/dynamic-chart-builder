
import React from 'react';
import { Grid } from '@mui/material';
import { CloseCallFilters } from '../types/closeCall';
import { getResetCloseCallFilters } from '../utils/closeCallUtils';
import BaseFilter from './tools/filterbox/BaseFilter';
import { SelectFilter, SwitchFilter, TextFilter } from './tools/filterbox/FilterFields';

interface CloseCallFilterProps {
  filters: CloseCallFilters;
  onFiltersChange: (filters: CloseCallFilters) => void;
  onApply: (filters: CloseCallFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const CloseCallFilter: React.FC<CloseCallFilterProps> = (props) => {
  const { filters, onFiltersChange } = props;

  const handleFilterChange = (key: keyof CloseCallFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const VEHICLE_CLASS_OPTIONS = [
    { value: '', label: 'All Classes' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'pallet_truck', label: 'Pallet Truck' },
    { value: 'agv', label: 'AGV' },
  ];

  const TIME_BUCKET_OPTIONS = [
    { value: '', label: 'No Bucket' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];

  return (
    <BaseFilter {...props} title="Close Call Filters" resetFilters={getResetCloseCallFilters()}>
      {/* Time Range */}
      <Grid size={{ xs: 12 }}>
        <TextFilter
          label="From Time"
          value={filters.from_time || ''}
          onChange={(value) => handleFilterChange('from_time', value)}
          type="datetime-local"
        />
      </Grid>
      
      <Grid size={{ xs: 12 }}>
        <TextFilter
          label="To Time"
          value={filters.to_time || ''}
          onChange={(value) => handleFilterChange('to_time', value)}
          type="datetime-local"
        />
      </Grid>

      {/* Distance Threshold */}
      <Grid size={{ xs: 12 }}>
        <TextFilter
          label="Distance Threshold (meters)"
          value={filters.distance_threshold || 0}
          onChange={(value) => handleFilterChange('distance_threshold', value)}
          type="number"
          inputProps={{ min: 0.1, max: 10, step: 0.1 }}
        />
      </Grid>

      {/* Time Window */}
      <Grid size={{ xs: 12 }}>
        <TextFilter
          label="Time Window (ms)"
          value={filters.time_window_ms || 0}
          onChange={(value) => handleFilterChange('time_window_ms', value)}
          type="number"
          inputProps={{ min: 50, max: 1000, step: 50 }}
        />
      </Grid>

      {/* Object Class */}
      <Grid size={{ xs: 12 }}>
        <SelectFilter
          label="Vehicle Class"
          value={filters.object_class || ''}
          onChange={(value) => handleFilterChange('object_class', value)}
          options={VEHICLE_CLASS_OPTIONS}
        />
      </Grid>

      {/* Zone */}
      <Grid size={{ xs: 12 }}>
        <TextFilter
          label="Zone"
          value={filters.zone || ''}
          onChange={(value) => handleFilterChange('zone', value)}
          placeholder="Filter by specific zone"
        />
      </Grid>

      {/* Time Bucket */}
      <Grid size={{ xs: 12 }}>
        <SelectFilter
          label="Time Bucket"
          value={filters.time_bucket || ''}
          onChange={(value) => handleFilterChange('time_bucket', value)}
          options={TIME_BUCKET_OPTIONS}
        />
      </Grid>

      {/* Switches */}
      <Grid size={{ xs: 12 }}>
        <SwitchFilter
          label="Include Details"
          checked={filters.include_details ?? true}
          onChange={(checked) => handleFilterChange('include_details', checked)}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <SwitchFilter
          label="Force Refresh"
          checked={filters.force_refresh ?? false}
          onChange={(checked) => handleFilterChange('force_refresh', checked)}
        />
      </Grid>
    </BaseFilter>
  );
};

export default CloseCallFilter;