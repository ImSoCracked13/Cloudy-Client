import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { FileItem, FileUploadProgress } from '../types/file';
import { fileService } from '../services/fileService';
import { formatFileSize } from '../utilities/formatFileSize';
import { notificationService } from '../common/Notification';

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = createStore<Record<string, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal<string | null>(null);

  /**
   * Upload multiple files to the server
   * @param files Files to upload
   * @param parentId Optional parent folder ID
   */
  const uploadFiles = async (
    files: File[], 
    parentId: string | null = null
  ): Promise<void> => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    // Initialize progress tracking for each file
    const fileIds: Record<string, string> = {};
    
    files.forEach(file => {
      const tempId = `temp-${Date.now()}-${file.name}`;
      fileIds[file.name] = tempId;
      
      setUploadProgress(tempId, {
        fileId: tempId,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      });
    });
    
    // Upload each file
    const uploadPromises = files.map(async (file) => {
      const fileId = fileIds[file.name];
      
      try {
        // Start uploading
        setUploadProgress(fileId, {
          status: 'uploading',
          progress: 0
        });
        
        // Track upload progress
        const onProgress = (progress: number) => {
          setUploadProgress(fileId, 'progress', progress);
        };
        
        // Upload the file using the service
        const uploadedFile = await fileService.uploadFile(
          file,
          parentId,
          onProgress
        );
        
        // Update progress on completion
        if (uploadedFile) {
          setUploadProgress(fileId, {
            status: 'completed',
            progress: 100,
            fileId: uploadedFile.id
          });
          return uploadedFile;
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        
        // Update progress on error
        setUploadProgress(fileId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0
        });
        
        return null;
      }
    });
    
    try {
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Check if any uploads failed
      const failedUploads = Object.values(uploadProgress).filter(
        item => item.status === 'error'
      );
      
      if (failedUploads.length > 0) {
        if (failedUploads.length === files.length) {
          // All uploads failed
          setUploadError('All file uploads failed');
        } else {
          // Some uploads failed
          setUploadError(`${failedUploads.length} of ${files.length} file uploads failed`);
        }
      } else {
        // All uploads succeeded
        notificationService.success(
          files.length === 1
            ? `File ${files[0].name} uploaded successfully`
            : `${files.length} files uploaded successfully`
        );
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Clear the upload progress for a specific file or all files
   */
  const clearUploadProgress = (fileId?: string) => {
    if (fileId) {
      const newProgress = { ...uploadProgress };
      delete newProgress[fileId];
      setUploadProgress(newProgress);
    } else {
      setUploadProgress({});
    }
    
    if (Object.keys(uploadProgress).length === 0) {
      setUploadError(null);
    }
  };
  
  /**
   * Get the average upload progress across all active uploads
   */
  const getAverageUploadProgress = () => {
    const activeUploads = Object.values(uploadProgress).filter(
      item => item.status === 'uploading' || item.status === 'pending'
    );
    
    if (activeUploads.length === 0) return 0;
    
    const totalProgress = activeUploads.reduce(
      (sum, item) => sum + item.progress, 
      0
    );
    
    return totalProgress / activeUploads.length;
  };
  
  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    uploadError,
    clearUploadProgress,
    getAverageUploadProgress
  };
} 