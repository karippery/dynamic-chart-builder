
import React from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Box,
  Chip,
} from '@mui/material';

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
  width?: string | number;
  filterChip?: {
    label: string;
    onDelete: () => void;
  };
}

interface TableHeaderProps {
  columns: TableColumn[];
  order?: 'asc' | 'desc';
  orderBy?: string;
  onSort?: (property: string) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  order = 'desc',
  orderBy = '',
  onSort,
}) => {
  const createSortHandler = (property: string) => () => {
    onSort?.(property);
  };

  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            sortDirection={orderBy === column.id ? order : false}
            sx={{ 
              minWidth: column.width || 'auto',
              width: column.width || 'auto'
            }}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
                {orderBy === column.id ? (
                  <Box component="span" sx={{ display: 'none' }}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              column.label
            )}
            
            {/* Filter chips */}
            {column.filterChip && (
              <Chip 
                label={column.filterChip.label} 
                size="small" 
                sx={{ ml: 1 }}
                onDelete={column.filterChip.onDelete}
              />
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};