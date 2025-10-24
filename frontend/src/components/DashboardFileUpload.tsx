// frontend\src\components\DashboardFileUpload.tsx
import React from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import FileUpload from './FileUpload';
import { UploadResponse } from '../types/upload';

interface DashboardFileUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
}

const DashboardFileUpload: React.FC<DashboardFileUploadProps> = ({
  onUploadSuccess,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleUploadSuccess = (response: UploadResponse) => {
    console.log('Upload successful:', response);
    onUploadSuccess?.(response);
    
    setTimeout(() => {
      setIsExpanded(false);
    }, 1500);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mb: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" color="primary.main">
            Upload Data
          </Typography>
        </Box>
        <IconButton size="small">
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
            Upload CSV to update KPI data
          </Typography>
          
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            acceptedFileTypes=".csv"
            maxFileSize={10 * 1024 * 1024}
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DashboardFileUpload;