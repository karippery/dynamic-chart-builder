import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography
} from '@mui/material';
import { FilterList, Refresh } from '@mui/icons-material';
import { SafetyFiltersType } from '../types/safety';

interface SafetyFiltersProps {
  filters: SafetyFiltersType;
  onFiltersChange: (filters: SafetyFiltersType) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const SafetyFilters: React.FC<SafetyFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isLoading = false
}) => {
  const handleFilterChange = (key: keyof SafetyFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleReset = () => {
    onFiltersChange({
      page: 1,
      page_size: 10,
      time_bucket: '1h'
    });
    onReset();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <FilterList color="primary" />
        <Typography variant="h6">Filters</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Zone"
            value={filters.zone || ''}
            onChange={(e) => handleFilterChange('zone', e.target.value)}
            placeholder="e.g., 9, 12"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Time Bucket"
            value={filters.time_bucket || '1h'}
            onChange={(e) => handleFilterChange('time_bucket', e.target.value)}
            select
          >
            <MenuItem value="15m">15 minutes</MenuItem>
            <MenuItem value="1h">1 hour</MenuItem>
            <MenuItem value="4h">4 hours</MenuItem>
            <MenuItem value="1d">1 day</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Speed Threshold (m/s)"
            type="number"
            value={filters.speed_threshold || 1.5}
            onChange={(e) => handleFilterChange('speed_threshold', parseFloat(e.target.value))}
            inputProps={{ step: 0.1, min: 0 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Object Class"
            value={filters.object_class || ''}
            onChange={(e) => handleFilterChange('object_class', e.target.value)}
            placeholder="e.g., AGV"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Page Size"
            type="number"
            value={filters.page_size || 10}
            onChange={(e) => handleFilterChange('page_size', parseInt(e.target.value))}
            inputProps={{ min: 1, max: 100 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.include_humans || false}
                onChange={(e) => handleFilterChange('include_humans', e.target.checked)}
              />
            }
            label="Include Humans in Overspeed Monitoring"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.force_refresh || false}
                onChange={(e) => handleFilterChange('force_refresh', e.target.checked)}
              />
            }
            label="Force Refresh Cache"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={onApply}
              disabled={isLoading}
              startIcon={<Refresh />}
            >
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};