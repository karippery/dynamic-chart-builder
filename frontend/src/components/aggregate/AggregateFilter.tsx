import React, { useState, useEffect } from 'react';
import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import DateRangePicker from '../tools/DateRangePicker';
import { AggregationFilters, DateRange } from '../../types/filters';
import { DEFAULT_FILTERS } from './AggregateFilterConstants';
import BaseFilter from '../tools/filterbox/BaseFilter';
import { MultiSelectFilter, SelectFilter, TextFilter } from '../tools/filterbox/FilterFields';

interface DashboardFilterProps {
  filters: AggregationFilters;
  onFiltersChange: (filters: AggregationFilters) => void;
  onApply: (filters: AggregationFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const DashboardFilter: React.FC<DashboardFilterProps> = (props) => {
  const { filters, onApply, onReset } = props;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<AggregationFilters>(filters);

  // Sync local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AggregationFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    // Optional: Auto-apply changes or debounce
    // onFiltersChange(updatedFilters);
  };

  const handleDateRangeChange = (dateRange: DateRange) => {
    let fromTime = '';
    let toTime = '';

    if (dateRange.startDate && dateRange.startTime) {
      const startDateTime = new Date(dateRange.startDate);
      const [startHours, startMinutes] = dateRange.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
      fromTime = startDateTime.toISOString();
    }

    if (dateRange.endDate && dateRange.endTime) {
      const endDateTime = new Date(dateRange.endDate);
      const [endHours, endMinutes] = dateRange.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
      toTime = endDateTime.toISOString();
    }

    const updatedFilters = {
      ...localFilters,
      from_time: fromTime || undefined,
      to_time: toTime || undefined,
    };
    setLocalFilters(updatedFilters);
  };

  const getCurrentDateRange = (): DateRange => {
    const startDate = localFilters.from_time ? new Date(localFilters.from_time) : null;
    const endDate = localFilters.to_time ? new Date(localFilters.to_time) : null;
    
    return {
      startDate,
      endDate,
      startTime: startDate ? `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}` : '00:00',
      endTime: endDate ? `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}` : '23:59',
    };
  };

  // Handle apply button click
  const handleApply = () => {
    onApply(localFilters);
  };

  // Handle reset button click
  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
  };

  return (
    <BaseFilter 
      {...props} 
      filters={localFilters}
      onFiltersChange={setLocalFilters}
      onApply={handleApply}
      onReset={handleReset}
      title="Dashboard Filters" 
      resetFilters={DEFAULT_FILTERS}
    >
      {/* Metric & Entity */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <SelectFilter
          label="Metric *"
          value={localFilters.metric}
          onChange={(value) => handleFilterChange('metric', value)}
          options={[
            { value: 'count', label: 'Count' },
            { value: 'unique_ids', label: 'Unique Objects' },
            { value: 'avg_speed', label: 'Average Speed' },
            { value: 'rate', label: 'Rate' },
          ]}
          size="small"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <SelectFilter
          label="Entity"
          value={localFilters.entity}
          onChange={(value) => handleFilterChange('entity', value)}
          options={[
            { value: '', label: 'None' },
            { value: 'events', label: 'Events' },
            { value: 'objects', label: 'Objects' },
          ]}
          size="small"
        />
      </Grid>

      {/* Group By & Time Bucket */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <MultiSelectFilter
          label="Group By"
          value={localFilters.group_by}
          onChange={(value) => handleFilterChange('group_by', value)}
          options={[
            { value: 'time_bucket', label: 'Time Bucket' },
            { value: 'object_class', label: 'Object Class' },
            { value: 'zone', label: 'Zone' },
            { value: 'vest', label: 'Vest' },
          ]}
          size="small"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <SelectFilter
          label="Time Bucket"
          value={localFilters.time_bucket}
          onChange={(value) => handleFilterChange('time_bucket', value)}
          options={[
            { value: '1m', label: '1 Minute' },
            { value: '5m', label: '5 Minutes' },
            { value: '15m', label: '15 Minutes' },
            { value: '1h', label: '1 Hour' },
            { value: '6h', label: '6 Hours' },
            { value: '1d', label: '1 Day' },
          ]}
          size="small"
        />
      </Grid>

      {/* Object Class */}
      <Grid size={{ xs: 12 }}>
        <MultiSelectFilter
          label="Object Class"
          value={localFilters.object_class || []}
          onChange={(value) => handleFilterChange('object_class', value)}
          options={[
            { value: 'human', label: 'Human' },
            { value: 'vehicle', label: 'Vehicle' },
            { value: 'pallet_truck', label: 'Pallet Truck' },
            { value: 'agv', label: 'AGV' },
          ]}
          size="small"
        />
      </Grid>

      {/* Date Range Picker */}
      <Grid size={{ xs: 12 }}>
        <DateRangePicker
          dateRange={getCurrentDateRange()}
          onChange={handleDateRangeChange}
        />
      </Grid>

      {/* Safety Vest */}
      <Grid size={{ xs: 12 }}>
        <SelectFilter
          label="Safety Vest"
          value={localFilters.vest === undefined ? '' : localFilters.vest.toString()}
          onChange={(value) => {
            if (value === '') {
              handleFilterChange('vest', undefined);
            } else {
              handleFilterChange('vest', value === 'true');
            }
          }}
          options={[
            { value: '', label: 'Not Specified' },
            { value: 'true', label: 'Required' },
            { value: 'false', label: 'Not Required' },
          ]}
          size="small"
        />
      </Grid>

      {/* Advanced Filters Accordion */}
      <Grid size={{ xs: 12 }}>
        <Accordion 
          expanded={showAdvanced}
          onChange={() => setShowAdvanced(!showAdvanced)}
          sx={{ mt: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {[
                { label: 'Min Speed', key: 'min_speed' },
                { label: 'Max Speed', key: 'max_speed' },
                { label: 'Min X', key: 'min_x' },
                { label: 'Max X', key: 'max_x' },
                { label: 'Min Y', key: 'min_y' },
                { label: 'Max Y', key: 'max_y' },
              ].map(({ label, key }) => (
                <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextFilter
                    label={label}
                    value={localFilters[key as keyof AggregationFilters] || ''}
                    onChange={(value) => handleFilterChange(key as keyof AggregationFilters, value ? parseFloat(value) : undefined)}
                    type="number"
                    size="small"
                  />
                </Grid>
              ))}
              
              <Grid size={{ xs: 12 }}>
                <TextFilter
                  label="Zone"
                  value={localFilters.zone || ''}
                  onChange={(value) => handleFilterChange('zone', value || undefined)}
                  size="small"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </BaseFilter>
  );
};

export default DashboardFilter;
export { DEFAULT_FILTERS };