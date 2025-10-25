// frontend/src/components/tables/BaseTable.tsx
import React from 'react';
import {
  Paper,
  Table,
  TableContainer,
  Typography,
  Box,
  Alert,
  useTheme,
} from '@mui/material';

export interface BaseTableProps {
  title?: string;
  data: any[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  children: React.ReactNode;
  height?: number | string;
}

export const BaseTable: React.FC<BaseTableProps> = ({
  title,
  data,
  isLoading = false,
  error = null,
  emptyMessage = "No data available",
  children,
  height = 400,
}) => {
  const theme = useTheme();

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 2 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2 }}>
            {title}
          </Typography>
        )}
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {title && (
        <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
          {title}
        </Typography>
      )}
      <TableContainer sx={{ maxHeight: height }}>
        <Table 
          stickyHeader 
          aria-label={title || "data table"} 
          size="medium"
          sx={{
            '& .MuiTableHead-root': {
              position: 'sticky',
              top: 0,
              backgroundColor: theme.palette.background.paper,
              zIndex: 1,
              '& .MuiTableCell-root': {
                backgroundColor: theme.palette.background.paper,
                fontWeight: 'bold',
                borderBottom: '2px solid',
                borderBottomColor: theme.palette.divider,
              }
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          {children}
        </Table>
      </TableContainer>
    </Paper>
  );
};