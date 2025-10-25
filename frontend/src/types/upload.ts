
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export interface UploadResponse {
  message: string;
  recordsProcessed: number;
  errors: string[];
}

export interface FileUploadProps {
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadError?: (error: string) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
}