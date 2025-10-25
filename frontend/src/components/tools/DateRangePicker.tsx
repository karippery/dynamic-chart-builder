
import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateRange } from '../../types/filters';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ dateRange, onChange }) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: Date | null) => {
    onChange({
      ...dateRange,
      [field]: value,
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    onChange({
      ...dateRange,
      [field]: value,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Date & Time Range
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="Start Date"
              value={dateRange.startDate}
              onChange={(value) => handleDateChange('startDate', value)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="time"
              label="Start Time"
              value={dateRange.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DatePicker
              label="End Date"
              value={dateRange.endDate}
              onChange={(value) => handleDateChange('endDate', value)}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="time"
              label="End Time"
              value={dateRange.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;