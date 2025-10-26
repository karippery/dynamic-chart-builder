// frontend/src/components/tools/tables/BaseTable.tsx
import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableContainer,
  Typography,
  Box,
  Alert,
  useTheme,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert,
  Save,
  TableChart, // CSV export icon
} from '@mui/icons-material';

export interface BaseTableProps {
  title?: string;
  data: any[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  children: React.ReactNode;
  height?: number | string;
  tableId?: string; // Optional: for presets
  filters?: any; // Optional: for presets
}

export const BaseTable: React.FC<BaseTableProps> = ({
  title,
  data,
  isLoading = false,
  error = null,
  emptyMessage = "No data available",
  children,
  height = 400,
  tableId,
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSavePreset = () => {
    setPresetsOpen(true);
    handleMenuClose();
  };

  // Function to export table data as CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    try {
      // Extract headers from the first data object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title?.toLowerCase().replace(/\s+/g, '-') || 'data'}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      handleMenuClose();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting data to CSV. Please try again.');
    }
  };

  // Generate table ID if not provided
  const generatedTableId = tableId || `table-${title?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

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
    <>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Table Header with Actions */}
        {title && (
          <Box 
            sx={{ 
              p: 2, 
              pb: 1, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <Typography variant="h6">
              {title}
            </Typography>
            
            {/* Export and Preset Actions - Only show if tableId is provided */}
            {tableId && (
              <Box>
                {/* CSV Export Button */}
                <Tooltip title="Export to CSV">
                  <IconButton onClick={exportToCSV} size="small">
                    <TableChart />
                  </IconButton>
                </Tooltip>
                
                {/* More Options Menu */}
                <Tooltip title="More options">
                  <IconButton onClick={handleMenuOpen} size="small">
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={exportToCSV}>
                    <TableChart sx={{ mr: 1 }} />
                    Export to CSV
                  </MenuItem>
                  <MenuItem onClick={handleSavePreset}>
                    <Save sx={{ mr: 1 }} />
                    Save as Preset
                  </MenuItem>
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    setPresetsOpen(true);
                  }}>
                    <Save sx={{ mr: 1 }} />
                    Manage Presets
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        )}

        {/* Table Content */}
        <TableContainer sx={{ maxHeight: height }} id={generatedTableId}>
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
    </>
  );
};