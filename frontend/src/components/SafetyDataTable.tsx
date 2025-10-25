import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { OverspeedEvent, VestViolation } from '../types/safety';

interface SafetyDataTableProps {
  title: string;
  data: VestViolation[] | OverspeedEvent[];
  type: 'vest-violations' | 'overspeed-events';
  isLoading?: boolean;
}

export const SafetyDataTable: React.FC<SafetyDataTableProps> = ({
  title,
  data,
  type,
  isLoading = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
          {title}
        </Typography>
        <Table stickyHeader aria-label={title}>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Tracking ID</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Location</TableCell>
              {type === 'overspeed-events' && (
                <>
                  <TableCell>Object Class</TableCell>
                  <TableCell>Speed</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{formatDate(item.timestamp)}</TableCell>
                <TableCell>
                  <Chip 
                    label={item.tracking_id} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={`Zone ${item.zone}`} 
                    color="primary" 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    ({item.x.toFixed(1)}, {item.y.toFixed(1)})
                  </Typography>
                </TableCell>
                {type === 'overspeed-events' && (
                  <>
                    <TableCell>
                      <Chip 
                        label={(item as OverspeedEvent).object_class} 
                        color="secondary" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${(item as OverspeedEvent).speed}m/s`} 
                        color="error" 
                        size="small"
                      />
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};