// frontend\src\services\uploadService.ts
import ApiService from './api';
import { UploadResponse } from '../types/upload';

class UploadService extends ApiService {
  constructor() {
    super();
  }

  async uploadCSV(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const normalizedEndpoint = 'upload';
      const url = `${this.baseUrl}/${normalizedEndpoint}`;
      
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(Math.round(progress));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'));
        });

        xhr.open('POST', url);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload service error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateCSV(file: File): Promise<string[]> {
    const errors: string[] = [];

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      errors.push('Please upload a CSV file');
    }

    // Check file size (default 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return errors;
  }
}

export default new UploadService();