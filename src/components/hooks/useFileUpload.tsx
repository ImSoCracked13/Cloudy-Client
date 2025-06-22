import { createSignal, Accessor } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { fileService } from '../services/fileService';
import { FileItem } from '../types/fileType';
import { notificationService } from '../common/Notification';
import { formatFileSize } from '../utilities/fileSizeFormatter';

/**
 * Interface for tracking file upload progress
 */
export interface FileUploadProgress {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

/**
 * Return type for the useFileUpload hook
 */
export interface FileUploadHook {
  uploadFiles: (files: File[], parentId: string | null, overwrite?: boolean) => Promise<void>;
  uploadProgress: Record<string, FileUploadProgress>;
  isUploading: () => boolean;
  uploadError: () => string | null;
  clearUploadProgress: () => void;
  getAverageUploadProgress: () => number;
  showOverwriteConfirm: Accessor<boolean>;
  confirmOverwrite: () => Promise<void>;
  cancelOverwrite: () => void;
  pendingFiles: Accessor<File[]>;
}

export function useFileUpload(): FileUploadHook {
  const [uploadProgress, setUploadProgress] = createStore<Record<string, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal<string | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = createSignal(false);
  const [pendingFiles, setPendingFiles] = createSignal<File[]>([]);
  const [pendingFolderId, setPendingFolderId] = createSignal<string | null>(null);
  const [overwriteConfirmed, setOverwriteConfirmed] = createSignal(false);

  /**
   * Upload multiple files to the server
   * @param files Files to upload
   * @param parentId Optional parent folder ID
   * @param overwrite Whether to overwrite existing files
   */
  const uploadFiles = async (
    files: File[], 
    parentId: string | null = null,
    overwrite: boolean = false
  ): Promise<void> => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Initialize progress tracking for each file
      const newProgress: Record<string, FileUploadProgress> = {};
      files.forEach(file => {
        newProgress[file.name] = {
          name: file.name,
          progress: 0,
          status: 'pending'
        };
      });
      setUploadProgress(newProgress);
    
      // Upload each file sequentially
      for (const file of files) {
        try {
          // Update status to uploading
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              status: 'uploading'
            }
          }));
          
          // Upload the file with progress tracking
          await fileService.uploadFile(
            file, 
            parentId || undefined,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: {
                  ...prev[file.name],
                  progress
                }
              }));
            },
            overwrite
          );
          
          // Update status to completed
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: 100,
              status: 'completed'
            }
          }));
          
          notificationService.success(`Uploaded ${file.name}`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          
          // Update status to error
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          }));
          
          notificationService.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error in uploadFiles:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Confirm overwrite and proceed with upload
   */
  const confirmOverwrite = async (): Promise<void> => {
    setShowOverwriteConfirm(false);
    setOverwriteConfirmed(true);
    await performUpload(pendingFiles(), pendingFolderId(), true);
  };
  
  /**
   * Cancel overwrite and don't upload conflicting files
   */
  const cancelOverwrite = () => {
    setShowOverwriteConfirm(false);
    setPendingFiles([]);
    setPendingFolderId(null);
    notificationService.info("Upload canceled to prevent overwriting existing files");
  };
  
  /**
   * Perform the actual upload operation
   */
  const performUpload = async (
    files: File[], 
    parentId: string | null = null,
    overwriteIfExists: boolean = false
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
        name: file.name,
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
          parentId || '/',
          onProgress,
          overwriteIfExists
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
      // Clear pending files after upload
      setPendingFiles([]);
      setPendingFolderId(null);
    }
  };
  
  /**
   * Clear all upload progress
   */
  const clearUploadProgress = () => {
      setUploadProgress({});
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
    getAverageUploadProgress,
    showOverwriteConfirm,
    confirmOverwrite,
    cancelOverwrite,
    pendingFiles
  };
} 