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
  TablePagination,
  TableFooter,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { CloseCallResponse } from '../types/closeCall';
import { getSeverityColor, formatCloseCallTime } from '../utils/closeCallUtils';

interface CloseCallDetailsProps {
  data: CloseCallResponse | null;
  isLoading?: boolean;
  onSeverityFilter?: (severity: string | null) => void;
  onVehicleClassFilter?: (vehicleClass: string | null) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPage /> : <FirstPage />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPage /> : <LastPage />}
      </IconButton>
    </Box>
  );
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

  // Get pagination info from API response
  const paginationInfo = data?.pagination?.close_calls;
  const totalCount = paginationInfo?.count || data?.total_count || 0;
  const currentPage = paginationInfo?.page ? paginationInfo.page - 1 : page; // Convert 1-based to 0-based
  const totalPages = paginationInfo?.pages || 0;
  const pageSize = paginationInfo?.page_size || rowsPerPage;

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

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    const pageForApi = newPage + 1; // Convert to 1-based for API
    setPage(newPage);
    onPageChange?.(pageForApi, pageSize);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPageChange?.(1, newRowsPerPage); // Reset to first page with new page size
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
        
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            maxHeight: 600,
            '& .MuiTableHead-root': {
              position: 'sticky',
              top: 0,
              backgroundColor: 'background.paper',
              zIndex: 1,
              '& .MuiTableCell-root': {
                backgroundColor: 'background.paper',
                fontWeight: 'bold',
                borderBottom: '2px solid',
                borderBottomColor: 'divider',
              }
            }
          }}
        >
          <Table stickyHeader aria-label="close call details table">
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
                <TableCell>Time Diff (ms)</TableCell>
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
                  <TableCell>{call.time_difference_ms}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  colSpan={8}
                  count={totalCount}
                  rowsPerPage={pageSize}
                  page={currentPage}
                  slotProps={{
                    select: {
                      inputProps: {
                        'aria-label': 'rows per page',
                      },
                      native: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {filteredCalls.length} of {data.close_calls.length} close calls on this page
            {totalCount > data.close_calls.length && ` (${totalCount} total)`}
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