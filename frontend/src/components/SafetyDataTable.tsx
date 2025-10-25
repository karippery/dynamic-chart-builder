
import React from 'react';
import {
  Chip,
  Typography,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { OverspeedEvent, VestViolation } from '../types/safety';
import { BaseTable } from './tools/tables/BaseTable';
import { TableHeader, TableColumn } from './tools/tables/TableHeader';

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

  // Define columns based on table type
  const columns: TableColumn[] = React.useMemo(() => {
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
    </BaseTable>
  );
};