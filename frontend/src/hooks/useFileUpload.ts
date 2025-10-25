
import { useState, useCallback } from 'react';
import { UploadState, UploadResponse } from '../types/upload';
import uploadService from '../services/uploadService';

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    });
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    onSuccess?: (response: UploadResponse) => void,
    onError?: (error: string) => void
  ) => {
    // Reset state before new upload
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    try {
      // Validate file
      const validationErrors = await uploadService.validateCSV(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Upload file
      const response = await uploadService.uploadCSV(file, (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      });

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true,
        progress: 100,
      }));

      onSuccess?.(response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        success: false,
      }));

      onError?.(errorMessage);
      throw error;
    }
  }, []);

  return {
    uploadState,
    uploadFile,
    resetUploadState,
  };
};