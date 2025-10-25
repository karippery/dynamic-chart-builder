
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Grid,
  Divider,
} from '@mui/material';
import { FilterList, Refresh } from '@mui/icons-material';

export interface BaseFilterProps<T> {
  title: string;
  filters: T;
  onFiltersChange: (filters: T) => void;
  onApply: (filters: T) => void;
  onReset: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  resetFilters: T;
}

const BaseFilter = <T,>({
  title,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isLoading = false,
  children,
  resetFilters,
}: BaseFilterProps<T>) => {
  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    onFiltersChange(resetFilters);
    onReset();
  };

  return (
    <Card elevation={1}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <span>{title}</span>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {children}
          
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

export default BaseFilter;