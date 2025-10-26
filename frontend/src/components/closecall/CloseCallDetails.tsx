import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  Button,
  TablePagination,
} from '@mui/material';
import { CloseCallDetail, CloseCallResponse } from '../../types/closeCall';
import { getComparator, Order, stableSort } from '../tools/tables/tableUtils';
import { TableColumn, TableHeader } from '../tools/tables/TableHeader';
import { BaseTable } from '../tools/tables/BaseTable';
import { formatCloseCallTime, getSeverityColor } from '../../utils/closeCallUtils';

interface CloseCallDetailsProps {
  data: CloseCallResponse | null;
  isLoading?: boolean;
  onSeverityFilter?: (severity: string | null) => void;
  onVehicleClassFilter?: (vehicleClass: string | null) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}

const CloseCallDetails: React.FC<CloseCallDetailsProps> = ({ 
  data, 
  isLoading = false,
  onSeverityFilter,
  onVehicleClassFilter,
  onPageChange,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof CloseCallDetail>('timestamp');

  // Get pagination info from API response
  const paginationInfo = data?.pagination?.close_calls;
  const totalCount = paginationInfo?.count || data?.total_count || 0;
  const currentPage = paginationInfo?.page ? paginationInfo.page - 1 : page;
  const pageSize = paginationInfo?.page_size || rowsPerPage;

  // Define handlers with useCallback to prevent unnecessary re-renders
  const handleSeverityClick = useCallback((severity: string) => {
    const newSeverity = selectedSeverity === severity ? null : severity;
    setSelectedSeverity(newSeverity);
    onSeverityFilter?.(newSeverity);
  }, [selectedSeverity, onSeverityFilter]);

  const handleVehicleClassClick = useCallback((vehicleClass: string) => {
    const newVehicleClass = selectedVehicleClass === vehicleClass ? null : vehicleClass;
    setSelectedVehicleClass(newVehicleClass);
    onVehicleClassFilter?.(newVehicleClass);
  }, [selectedVehicleClass, onVehicleClassFilter]);

  const handleClearFilters = useCallback(() => {
    setSelectedSeverity(null);
    setSelectedVehicleClass(null);
    onSeverityFilter?.(null);
    onVehicleClassFilter?.(null);
  }, [onSeverityFilter, onVehicleClassFilter]);

  // Prepare data for CSV export - flatten the data structure
  const exportData = useMemo(() => {
    if (!data?.close_calls) return [];
    
    return data.close_calls.map(call => ({
      timestamp: call.timestamp,
      formatted_timestamp: formatCloseCallTime(call.timestamp),
      human_tracking_id: call.human_tracking_id,
      vehicle_tracking_id: call.vehicle_tracking_id,
      vehicle_class: call.vehicle_class,
      distance: call.distance,
      severity: call.severity,
      human_zone: call.human_zone || 'N/A',
      vehicle_zone: call.vehicle_zone || 'N/A',
      time_difference_ms: call.time_difference_ms,
      // Add any other fields you want to export
    }));
  }, [data?.close_calls]);

  // Table columns configuration
  const columns: TableColumn[] = useMemo(() => [
    { id: 'timestamp', label: 'Timestamp', sortable: true, width: 180 },
    { id: 'human_tracking_id', label: 'Human ID', sortable: true },
    { id: 'vehicle_tracking_id', label: 'Vehicle ID', sortable: true },
    { 
      id: 'vehicle_class', 
      label: 'Vehicle Class', 
      sortable: true,
      filterChip: selectedVehicleClass ? {
        label: selectedVehicleClass,
        onDelete: () => handleVehicleClassClick(selectedVehicleClass),
      } : undefined
    },
    { id: 'distance', label: 'Distance (m)', sortable: true, align: 'right', numeric: true, width: 120 },
    { 
      id: 'severity', 
      label: 'Severity', 
      sortable: true,
      filterChip: selectedSeverity ? {
        label: selectedSeverity,
        onDelete: () => handleSeverityClick(selectedSeverity),
      } : undefined
    },
    { id: 'human_zone', label: 'Zone', sortable: true },
    { id: 'time_difference_ms', label: 'Time Diff (ms)', sortable: true, align: 'right', numeric: true, width: 120 },
  ], [
    selectedSeverity, 
    selectedVehicleClass, 
    handleSeverityClick, 
    handleVehicleClassClick
  ]);

  // Filter calls based on severity and vehicle class
  const filteredCalls = useMemo(() => {
    if (!data?.close_calls) return [];
    return data.close_calls.filter(call => 
      (!selectedSeverity || call.severity === selectedSeverity) &&
      (!selectedVehicleClass || call.vehicle_class === selectedVehicleClass)
    );
  }, [data?.close_calls, selectedSeverity, selectedVehicleClass]);

  // Sort the filtered calls
  const sortedCalls = useMemo(() => 
    stableSort(filteredCalls, getComparator(order, orderBy)),
    [filteredCalls, order, orderBy]
  );

  // If no pagination from API, use client-side pagination
  const displayCalls = useMemo(() => {
    return paginationInfo 
      ? sortedCalls 
      : sortedCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [paginationInfo, sortedCalls, page, rowsPerPage]);

  const displayPage = paginationInfo ? currentPage : page;
  const displayRowsPerPage = paginationInfo ? pageSize : rowsPerPage;
  const displayTotalCount = paginationInfo ? totalCount : filteredCalls.length;

  const handleChangePage = useCallback((
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    const pageForApi = newPage + 1;
    setPage(newPage);
    onPageChange?.(pageForApi, pageSize);
  }, [onPageChange, pageSize]);

  const handleChangeRowsPerPage = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPageChange?.(1, newRowsPerPage);
  }, [onPageChange]);

  const handleSort = useCallback((property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property as keyof CloseCallDetail);
  }, [order, orderBy]);

  // Early return for no data
  if (!data?.close_calls || data.close_calls.length === 0) {
    return (
      <Alert severity="info">
        No close call details available for the selected filters.
      </Alert>
    );
  }

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
        
        <BaseTable
          data={exportData} // Use the flattened export data for CSV export
          isLoading={isLoading}
          height={600}
          tableId="close-call-details" // Add tableId to enable CSV export
          title="Close Call Details" // Add title for CSV filename
        >
          <TableHeader 
            columns={columns}
            order={order}
            orderBy={orderBy}
            onSort={handleSort}
          />
          <TableBody>
            {displayCalls.map((call, index) => (
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
                <TableCell align="right">
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
                <TableCell align="right">{call.time_difference_ms}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TablePagination
            count={displayTotalCount}
            page={displayPage}
            rowsPerPage={displayRowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            colSpan={columns.length}
          />
        </BaseTable>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {displayCalls.length} of {displayTotalCount} close calls
            {!paginationInfo && ` (${filteredCalls.length} filtered)`}
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