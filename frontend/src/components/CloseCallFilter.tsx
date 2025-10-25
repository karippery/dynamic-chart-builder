// frontend/src/components/CloseCallFilter.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
} from '@mui/material';
import { FilterList, Refresh } from '@mui/icons-material';
import { CloseCallFilters } from '../types/closeCall';
import { getResetCloseCallFilters } from '../utils/closeCallUtils';

interface CloseCallFilterProps {
  filters: CloseCallFilters;
  onFiltersChange: (filters: CloseCallFilters) => void;
  onApply: (filters: CloseCallFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const CloseCallFilter: React.FC<CloseCallFilterProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isLoading = false,
}) => {
  const handleFilterChange = (key: keyof CloseCallFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters = getResetCloseCallFilters();
    onFiltersChange(resetFilters);
    onReset();
  };

  return (
    <Card elevation={1}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <span>Close Call Filters</span>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* Time Range */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="From Time"
              type="datetime-local"
              value={filters.from_time || ''}
              onChange={(e) => handleFilterChange('from_time', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="To Time"
              type="datetime-local"
              value={filters.to_time || ''}
              onChange={(e) => handleFilterChange('to_time', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Distance Threshold */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Distance Threshold (meters)"
              type="number"
              value={filters.distance_threshold || 0}
              onChange={(e) => handleFilterChange('distance_threshold', parseFloat(e.target.value))}
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
            />
          </Grid>

          {/* Time Window */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Time Window (ms)"
              type="number"
              value={filters.time_window_ms || 0}
              onChange={(e) => handleFilterChange('time_window_ms', parseInt(e.target.value))}
              inputProps={{ min: 50, max: 1000, step: 50 }}
            />
          </Grid>

          {/* Object Class */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Vehicle Class</InputLabel>
              <Select
                value={filters.object_class || ''}
                label="Vehicle Class"
                onChange={(e) => handleFilterChange('object_class', e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                <MenuItem value="vehicle">Vehicle</MenuItem>
                <MenuItem value="pallet_truck">Pallet Truck</MenuItem>
                <MenuItem value="agv">AGV</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Zone */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Zone"
              value={filters.zone || ''}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
              placeholder="Filter by specific zone"
            />
          </Grid>

          {/* Time Bucket */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Time Bucket</InputLabel>
              <Select
                value={filters.time_bucket || ''}
                label="Time Bucket"
                onChange={(e) => handleFilterChange('time_bucket', e.target.value)}
              >
                <MenuItem value="">No Bucket</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="15m">15 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="4h">4 Hours</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Switches */}
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.include_details ?? true}
                  onChange={(e) => handleFilterChange('include_details', e.target.checked)}
                />
              }
              label="Include Details"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.force_refresh ?? false}
                  onChange={(e) => handleFilterChange('force_refresh', e.target.checked)}
                />
              }
              label="Force Refresh"
            />
          </Grid>

          {/* Action Buttons */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleApply}
                disabled={isLoading}
                startIcon={<Refresh />}
                fullWidth
              >
                {isLoading ? 'Loading...' : 'Apply Filters'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={isLoading}
                fullWidth
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CloseCallFilter;