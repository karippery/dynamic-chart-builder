// frontend/src/components/DashboardFilter.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { AggregationFilters, DateRange } from '../types/filters';
import DateRangePicker from './DateRangePicker';

const DEFAULT_FILTERS: AggregationFilters = {
  metric: 'count',
  entity: '',
  group_by: ['time_bucket'],
  time_bucket: '1h',
  object_class: [],
  vest: undefined,
  min_speed: undefined,
  max_speed: undefined,
  min_x: undefined,
  max_x: undefined,
  min_y: undefined,
  max_y: undefined,
  zone: undefined,
  from_time: undefined,
  to_time: undefined,
};

interface DashboardFilterProps {
  filters: AggregationFilters;
  onFiltersChange: (filters: AggregationFilters) => void;
  onApply: (filters: AggregationFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const METRIC_OPTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'unique_ids', label: 'Unique Objects' },
  { value: 'avg_speed', label: 'Average Speed' },
  { value: 'rate', label: 'Rate' },
];

const ENTITY_OPTIONS = [
  { value: 'events', label: 'Events' },
  { value: 'objects', label: 'Objects' },
];

const GROUP_BY_OPTIONS = [
  { value: 'time_bucket', label: 'Time Bucket' },
  { value: 'object_class', label: 'Object Class' },
  { value: 'zone', label: 'Zone' },
  { value: 'vest', label: 'Vest' },
];

const TIME_BUCKET_OPTIONS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '1d', label: '1 Day' },
];

const OBJECT_CLASS_OPTIONS = [
  { value: 'human', label: 'Human' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'pallet_truck', label: 'Pallet Truck' },
  { value: 'agv', label: 'AGV' },
];

const DashboardFilter: React.FC<DashboardFilterProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isLoading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<AggregationFilters>(filters);

  // Initialize with default filters if none provided
  useEffect(() => {
    if (!filters.group_by || filters.group_by.length === 0) {
      const initialFilters = { ...DEFAULT_FILTERS };
      setLocalFilters(initialFilters);
      onFiltersChange(initialFilters);
    } else {
      setLocalFilters(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof AggregationFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const handleMultiSelectChange = (key: keyof AggregationFilters, event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const updatedFilters = { 
      ...localFilters, 
      [key]: typeof value === 'string' ? value.split(',') : value 
    };
    setLocalFilters(updatedFilters);
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

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: AggregationFilters = {
      metric: 'count',
      entity: '',
      group_by: [],
      time_bucket: '1h',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset();
    console.log('Filters Reset:', resetFilters);
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

  return (
    <Card elevation={1} sx={{ mb: 3}}>
      <CardContent>
        <Box sx={{ display: 'flex', minHeight: 50, alignItems: 'center', mb: 2 }}>
          <FilterIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h2">
            Dashboard Filters
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Row 1: Metric & Entity */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Metric *</InputLabel>
              <Select
                value={localFilters.metric}
                label="Metric *"
                onChange={(e) => handleFilterChange('metric', e.target.value)}
              >
                {METRIC_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity</InputLabel>
              <Select
                value={localFilters.entity}
                label="Entity"
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {ENTITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 2: Group By & Time Bucket */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                multiple
                value={localFilters.group_by}
                onChange={(e) => handleMultiSelectChange('group_by', e)}
                input={<OutlinedInput label="Group By" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.length === 0 ? (
                      <em>1 Hour</em>
                    ) : (
                      selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={GROUP_BY_OPTIONS.find(opt => opt.value === value)?.label || value}
                          size="small" 
                        />
                      ))
                    )}
                  </Box>
                )}
              >
                {GROUP_BY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Bucket</InputLabel>
              <Select
                value={localFilters.time_bucket}
                label="Time Bucket"
                onChange={(e) => handleFilterChange('time_bucket', e.target.value)}
              >
                {TIME_BUCKET_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 3: Object Class (Full width) */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Object Class</InputLabel>
              <Select
                multiple
                value={localFilters.object_class || []}
                onChange={(e) => handleMultiSelectChange('object_class', e)}
                input={<OutlinedInput label="Object Class" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.length === 0 ? (
                      <em>None</em>
                    ) : (
                      selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={OBJECT_CLASS_OPTIONS.find(opt => opt.value === value)?.label || value}
                          size="small" 
                        />
                      ))
                    )}
                  </Box>
                )}
              >
                {OBJECT_CLASS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 4: Date Range Picker (Full width) */}
          <Grid size={{ xs: 12 }}>
            <DateRangePicker
              dateRange={getCurrentDateRange()}
              onChange={handleDateRangeChange}
            />
          </Grid>

          {/* Row 5: Safety Vest (Full width) */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Safety Vest</InputLabel>
              <Select
                value={localFilters.vest === undefined ? '' : localFilters.vest.toString()}
                label="Safety Vest"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleFilterChange('vest', undefined);
                  } else {
                    handleFilterChange('vest', value === 'true');
                  }
                }}
              >
                <MenuItem value="">
                  <em>Not Specified</em>
                </MenuItem>
                <MenuItem value="true">Required</MenuItem>
                <MenuItem value="false">Not Required</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Advanced Filters Accordion */}
        <Accordion 
          expanded={showAdvanced}
          onChange={() => setShowAdvanced(!showAdvanced)}
          sx={{ mt: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              Advanced Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Speed"
                  value={localFilters.min_speed || ''}
                  onChange={(e) => handleFilterChange('min_speed', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Speed"
                  value={localFilters.max_speed || ''}
                  onChange={(e) => handleFilterChange('max_speed', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min X"
                  value={localFilters.min_x || ''}
                  onChange={(e) => handleFilterChange('min_x', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max X"
                  value={localFilters.max_x || ''}
                  onChange={(e) => handleFilterChange('max_x', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Min Y"
                  value={localFilters.min_y || ''}
                  onChange={(e) => handleFilterChange('min_y', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Max Y"
                  value={localFilters.max_y || ''}
                  onChange={(e) => handleFilterChange('max_y', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Zone"
                  value={localFilters.zone || ''}
                  onChange={(e) => handleFilterChange('zone', e.target.value || undefined)}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={isLoading}
            startIcon={<FilterIcon />}
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardFilter;
export { DEFAULT_FILTERS };