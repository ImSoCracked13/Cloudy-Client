import { createSignal } from 'solid-js';
import { fileService } from '../services/fileService';
import { FileItem } from '../types/file';
import { notificationService } from '../common/Notification';
import { formatFileSize } from '../common/formatFileSize';

export function useFileUpload() {
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const [uploadedFiles, setUploadedFiles] = createSignal<FileItem[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  /**
   * Upload multiple files to a specific folder
   */
  const uploadFiles = async (files: File[], parentId?: string): Promise<FileItem[]> => {
    if (files.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let uploadedSize = 0;
    const results: FileItem[] = [];
    
    try {
      for (const file of files) {
        // Check file size limit (200MB)
        const maxSize = 200 * 1024 * 1024; // 200MB in bytes
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} exceeds the maximum size limit of ${formatFileSize(maxSize)}`);
        }
        
        const result = await fileService.uploadFile(
          file, 
          parentId || null,
          (progress) => {
            // Calculate overall progress based on this file's progress and already uploaded files
            const fileProgress = (progress / 100) * file.size;
            const totalProgress = ((uploadedSize + fileProgress) / totalSize) * 100;
            setUploadProgress(totalProgress);
          }
        );
        
        if (result) {
          results.push(result);
          uploadedSize += file.size;
          setUploadProgress((uploadedSize / totalSize) * 100);
        }
      }
      
      setUploadedFiles(results);
      
      if (results.length > 0) {
        const totalUploadedSize = formatFileSize(uploadedSize);
        notificationService.success(
          `Successfully uploaded ${results.length} ${results.length === 1 ? 'file' : 'files'} (${totalUploadedSize})`
        );
      }
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during upload';
      setError(errorMessage);
      notificationService.error(errorMessage);
      throw err;
    } finally {
      // Keep the progress bar visible for a moment before hiding
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };
  
  /**
   * Reset upload state
   */
  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedFiles([]);
    setError(null);
  };
  
  return {
    uploadFiles,
    resetUpload,
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,
  };
} 