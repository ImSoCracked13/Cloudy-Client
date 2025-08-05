import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for fast file upload functionality
 */
export function useUpload() {

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return [];

    fileStore.setUploadLoading(true);
    fileStore.setUploadError(null);
    
    try {
      // Upload files in parallel for faster processing
      const uploadPromises = files.map(async (file) => {
        try {
          return await fileService.uploadFile(file);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return null; // Return null for failed uploads
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result !== null);
      const failedCount = results.length - successfulUploads.length;

      if (successfulUploads.length === 0) {
        throw new Error('All uploads failed');
      }
      
      if (failedCount > 0) {
        fileStore.setUploadError(`${failedCount} file(s) failed to upload`);
      }

      return successfulUploads;
    } finally {
      fileStore.setUploadLoading(false);
    }
  };

  return {
    uploadFiles,
    loading: () => fileStore.state.uploadLoading,
    error: () => fileStore.state.uploadError,
  };
}