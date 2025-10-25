import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { CloseCallResponse } from '../types/closeCall';
import { getSeverityColor, formatCloseCallTime } from '../utils/closeCallUtils';

interface CloseCallDetailsProps {
  data: CloseCallResponse | null;
  isLoading?: boolean;
  onSeverityFilter?: (severity: string | null) => void;
  onVehicleClassFilter?: (vehicleClass: string | null) => void;
}

const CloseCallDetails: React.FC<CloseCallDetailsProps> = ({ 
  data, 
  isLoading = false,
  onSeverityFilter,
  onVehicleClassFilter,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState<string | null>(null);

  const handleSeverityClick = (severity: string) => {
    const newSeverity = selectedSeverity === severity ? null : severity;
    setSelectedSeverity(newSeverity);
    onSeverityFilter?.(newSeverity);
  };

  const handleVehicleClassClick = (vehicleClass: string) => {
    const newVehicleClass = selectedVehicleClass === vehicleClass ? null : vehicleClass;
    setSelectedVehicleClass(newVehicleClass);
    onVehicleClassFilter?.(newVehicleClass);
  };

  const handleClearFilters = () => {
    setSelectedSeverity(null);
    setSelectedVehicleClass(null);
    onSeverityFilter?.(null);
    onVehicleClassFilter?.(null);
  };

  if (!data?.close_calls || data.close_calls.length === 0) {
    return (
      <Alert severity="info">
        No close call details available for the selected filters.
      </Alert>
    );
  }

  const filteredCalls = data.close_calls.filter(call => 
    (!selectedSeverity || call.severity === selectedSeverity) &&
    (!selectedVehicleClass || call.vehicle_class === selectedVehicleClass)
  );

  return (
    <Card elevation={1}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Close Call Details
          </Typography>
          {(selectedSeverity || selectedVehicleClass) && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Box>
        
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Human ID</TableCell>
                <TableCell>Vehicle ID</TableCell>
                <TableCell>
                  Vehicle Class
                  {selectedVehicleClass && (
                    <Chip 
                      label={selectedVehicleClass} 
                      size="small" 
                      sx={{ ml: 1 }}
                      onDelete={() => handleVehicleClassClick(selectedVehicleClass)}
                    />
                  )}
                </TableCell>
                <TableCell>Distance (m)</TableCell>
                <TableCell>
                  Severity
                  {selectedSeverity && (
                    <Chip 
                      label={selectedSeverity} 
                      size="small" 
                      sx={{ ml: 1 }}
                      onDelete={() => handleSeverityClick(selectedSeverity)}
                    />
                  )}
                </TableCell>
                <TableCell>Zone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCalls.map((call, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {formatCloseCallTime(call.timestamp)}
                  </TableCell>
                  <TableCell>{call.human_tracking_id}</TableCell>
                  <TableCell>{call.vehicle_tracking_id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={call.vehicle_class} 
                      size="small" 
                      variant={selectedVehicleClass === call.vehicle_class ? "filled" : "outlined"}
                      onClick={() => handleVehicleClassClick(call.vehicle_class)}
                      clickable
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={call.distance < 1 ? 'error' : 'textPrimary'}
                      fontWeight={call.distance < 1 ? 'bold' : 'normal'}
                    >
                      {call.distance.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={call.severity} 
                      color={getSeverityColor(call.severity)}
                      size="small"
                      variant={selectedSeverity === call.severity ? "filled" : "outlined"}
                      onClick={() => handleSeverityClick(call.severity)}
                      clickable
                    />
                  </TableCell>
                  <TableCell>{call.human_zone || call.vehicle_zone || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {filteredCalls.length} of {data.close_calls.length} close calls
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Computed at: {formatCloseCallTime(data.computed_at)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CloseCallDetails;