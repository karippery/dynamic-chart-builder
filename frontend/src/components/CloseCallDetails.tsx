import React, { useState, useMemo } from 'react';
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
  TableSortLabel,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { CloseCallResponse, CloseCallDetail } from '../types/closeCall';
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

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof CloseCallDetail;
  label: string;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'timestamp', label: 'Timestamp', sortable: true, numeric: false },
  { id: 'human_tracking_id', label: 'Human ID', sortable: true, numeric: false },
  { id: 'vehicle_tracking_id', label: 'Vehicle ID', sortable: true, numeric: false },
  { id: 'vehicle_class', label: 'Vehicle Class', sortable: true, numeric: false },
  { id: 'distance', label: 'Distance (m)', sortable: true, align: 'right', numeric: true },
  { id: 'severity', label: 'Severity', sortable: true, numeric: false },
  { id: 'human_zone', label: 'Zone', sortable: true, numeric: false },
  { id: 'time_difference_ms', label: 'Time Diff (ms)', sortable: true, align: 'right', numeric: true },
];

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

// Type-safe comparator functions
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];
  
  // Handle null/undefined values
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  
  // Handle string comparison
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return bValue.localeCompare(aValue);
  }
  
  // Handle number comparison
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return bValue - aValue;
  }
  
  // Fallback for mixed types (shouldn't happen with proper typing)
  return String(bValue).localeCompare(String(aValue));
}

function getComparator<T>(
  order: Order,
  orderBy: keyof T,
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
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
    const pageForApi = newPage + 1;
    setPage(newPage);
    onPageChange?.(pageForApi, pageSize);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onPageChange?.(1, newRowsPerPage);
  };

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof CloseCallDetail,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler =
    (property: keyof CloseCallDetail) => (event: React.MouseEvent<unknown>) => {
      handleRequestSort(event, property);
    };

  // Early return for no data - moved after all hooks
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
          <Table stickyHeader aria-label="close call details table" size="medium">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align || 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{ 
                      minWidth: headCell.id === 'timestamp' ? 180 : 'auto',
                      width: headCell.numeric ? 120 : 'auto'
                    }}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                      >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                          <Box component="span" sx={{ display: 'none' }}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                    
                    {/* Filter chips for specific columns */}
                    {headCell.id === 'vehicle_class' && selectedVehicleClass && (
                      <Chip 
                        label={selectedVehicleClass} 
                        size="small" 
                        sx={{ ml: 1 }}
                        onDelete={() => handleVehicleClassClick(selectedVehicleClass)}
                      />
                    )}
                    {headCell.id === 'severity' && selectedSeverity && (
                      <Chip 
                        label={selectedSeverity} 
                        size="small" 
                        sx={{ ml: 1 }}
                        onDelete={() => handleSeverityClick(selectedSeverity)}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayCalls.map((call, index) => (
                <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  colSpan={8}
                  count={displayTotalCount}
                  rowsPerPage={displayRowsPerPage}
                  page={displayPage}
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