import React, { useState, useMemo } from 'react';
import {
  Chip,
  Typography,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { OverspeedEvent, VestViolation } from '../../types/safety';
import { BaseTable } from '../tools/tables/BaseTable';
import { TableHeader, TableColumn } from '../tools/tables/TableHeader';
import { TablePagination } from '../tools/tables/TablePagination';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle page change
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get current page data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, page, rowsPerPage]);

  // Define columns based on table type
  const columns: TableColumn[] = useMemo(() => {
    const baseColumns: TableColumn[] = [
      { id: 'timestamp', label: 'Timestamp', width: 180 },
      { id: 'tracking_id', label: 'Tracking ID' },
      { id: 'zone', label: 'Zone' },
      { id: 'location', label: 'Location' },
    ];

    if (type === 'overspeed-events') {
      return [
        ...baseColumns,
        { id: 'object_class', label: 'Object Class' },
        { id: 'speed', label: 'Speed' },
      ];
    }

    return baseColumns;
  }, [type]);

  return (
    <BaseTable
      title={title}
      data={data}
      isLoading={isLoading}
      emptyMessage="No data available"
      height={400}
    >
      <TableHeader columns={columns} />
      <TableBody>
        {paginatedData.map((item) => (
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
      
      {/* Pagination Component */}
      {data.length > 0 && (
        <TablePagination
          count={data.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          colSpan={columns.length}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </BaseTable>
  );
};