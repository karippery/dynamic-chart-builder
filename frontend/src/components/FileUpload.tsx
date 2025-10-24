// frontend\src\components\FileUpload.tsx
import React, { useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  useTheme,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileUploadProps } from '../types/upload';

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  acceptedFileTypes = '.csv',
  maxFileSize = 10 * 1024 * 1024, // 10MB
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadState, uploadFile, resetUploadState } = useFileUpload();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      setSelectedFile(file);
      resetUploadState();
    }
    
    if (event.target) {
      event.target.value = '';
    }
  }, [resetUploadState]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile, onUploadSuccess, onUploadError);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }, [selectedFile, uploadFile, onUploadSuccess, onUploadError]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    resetUploadState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetUploadState]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      resetUploadState();
    }
  }, [resetUploadState]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2, 
        border: `2px dashed ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptedFileTypes}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            textAlign: 'center',
            py: 1,
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon
            sx={{
              fontSize: 32,
              color: 'text.secondary',
              mb: 1,
            }}
          />
          <Typography variant="body1" gutterBottom color="text.primary">
            Upload CSV
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drag & drop or click to browse
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Compact File Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
              <FileIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {selectedFile.name}
                </Typography>
                <Chip 
                  label={formatFileSize(selectedFile.size)} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </Box>
            <IconButton
              onClick={handleRemoveFile}
              disabled={uploadState.isUploading}
              size="small"
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Compact Upload Progress */}
          {uploadState.isUploading && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={uploadState.progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {uploadState.progress}%
              </Typography>
            </Box>
          )}

          {/* Compact Alerts */}
          {uploadState.error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 1, 
                py: 0, 
                minHeight: 'auto',
                '& .MuiAlert-message': { 
                  py: 0.5,
                  fontSize: '0.75rem'
                },
                '& .MuiAlert-icon': {
                  fontSize: '1rem',
                  py: 0.5
                }
              }}
            >
              {uploadState.error}
            </Alert>
          )}

          {uploadState.success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 1, 
                py: 0,
                minHeight: 'auto',
                '& .MuiAlert-message': { 
                  py: 0.5,
                  fontSize: '0.75rem'
                },
                '& .MuiAlert-icon': {
                  fontSize: '1rem',
                  py: 0.5
                }
              }}
            >
              Upload successful!
            </Alert>
          )}

          {/* Compact Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              onClick={handleRemoveFile}
              disabled={uploadState.isUploading}
              size="small"
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadState.isUploading || !selectedFile}
              variant="contained"
              size="small"
              startIcon={<UploadIcon />}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {uploadState.isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FileUpload;