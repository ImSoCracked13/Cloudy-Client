import { fileGateway } from '../gateway/fileGateway';
import { FileItem, StorageStats, FilePreviewDto, ApiStorageStats } from '../types/fileType';

/**
 * File Service - Handles file operations business logic with internal store
 */
export const fileService = {

  /**
   * Upload a file to the server
   */
  async uploadFile(
    fileToUpload: File, 
    parentId?: string | null, 
    onProgress?: (progress: number) => void,
  ): Promise<FileItem> {
    try {
      
      // Validate file before upload
      if (!fileToUpload) throw new Error('No file provided');
      if (fileToUpload.size === 0) throw new Error('File is empty');
      
      // Enhanced progress callback that updates store
      const enhancedProgress = (progress: number) => {
        onProgress?.(progress);
      };
      
      // Get response from gateway
      const response = await fileGateway.uploadFile(
        fileToUpload,
        parentId || null,
        enhancedProgress,
      );
      
      const result = response.data;
      if (!result) throw new Error('Upload failed: No response data');
      
      // Handle successful upload
      window.dispatchEvent(new CustomEvent('file-uploaded', {
        detail: {
          fileId: result.id,
          fileName: result.name,
        }
      }));
      
      // Dispatch files-refreshed event to trigger immediate refresh
      window.dispatchEvent(new CustomEvent('files-refreshed', {
        detail: { location: 'Drive' }
      }));
      
      // Invalidate cache and dispatch storage change event for operations that affect storage usage
      this.invalidateStorageCache();
      
      window.dispatchEvent(new CustomEvent('storage-changed', {
        detail: { operation: 'upload', change: 'increase' }
      }));
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Get file preview data
   */
  async previewFile(fileId: string): Promise<FilePreviewDto> {
    try {
      const preview = await fileGateway.previewFile(fileId);
      
      // Fix the type issue by using type assertion or checking for existence
      const previewData = ('data' in preview ? preview.data : preview) as FilePreviewDto;
      
      // Ensure HTTPS for MinIO URLs
      if (previewData && previewData.url && previewData.url.includes('cloudy-api.duckdns.org')) {
        previewData.url = previewData.url.replace('http://', 'https://');
      }
      
      return previewData;
    } catch (error) {
      console.error('Error getting file preview:', error);
      throw error;
    }
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      
      // First get the file details to ensure we have the latest data
      const fileDetails = await this.getFileProperties(fileId);
      if (!fileDetails) {
        throw new Error('Could not find file to download');
      }
      
      // Use the current file name from the server, not the potentially outdated fileName parameter
      const currentFileName = fileDetails.name;
      
      const blob = await fileGateway.downloadFile(fileId, currentFileName);
      
      return blob;
      
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  /**
   * Rename a file or folder
   */
  async renameFile(fileId: string, oldName: string, newName: string): Promise<FileItem | null> {
    try {
      
      // Preserve file extension
      if (oldName.includes('.') && !oldName.startsWith('.')) {
        const oldExtension = oldName.substring(oldName.lastIndexOf('.'));
        if (!newName.endsWith(oldExtension)) {
          // Only add extension if it doesn't already have one
          if (!newName.includes('.') || newName.lastIndexOf('.') <= newName.lastIndexOf('/')) {
            newName = newName + oldExtension;
          }
        }
      }
      const file = await fileGateway.renameFile(fileId, newName);
      
      if (file) {
        
        // Ensure we have the latest file data by forcing a refresh
        try {
          // Clear any cached file data for this file ID
          localStorage.removeItem(`file_${fileId}`);
          
          // Dispatch events to update UI components
          const refreshEvent = new CustomEvent('files-refreshed', { 
            detail: { location: file.location, fileId } 
          });
          window.dispatchEvent(refreshEvent);
          
          // Also dispatch a specific file-renamed event that components can listen for
          const renamedEvent = new CustomEvent('file-renamed', {
            detail: { fileId, oldName, newName: file.name }
          });
          window.dispatchEvent(renamedEvent);
        } catch (refreshError) {
          console.warn('Error refreshing file lists after rename:', refreshError);
          // Continue even if refresh fails
        }
        
        return file;
      } else {
        console.error('File rename returned null or undefined result');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  },

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string): Promise<FileItem | null> {
    try {
      // Get original file details first
      const originalFile = await this.getFileProperties(fileId);
      if (!originalFile) {
        throw new Error('Original file not found');
      }
      
      // Call the API to duplicate the file
      const file = await fileGateway.duplicateFile(fileId);
      
      if (file) {
        try {
          // Dispatch events to update UI components
          const refreshEvent = new CustomEvent('files-refreshed', { 
            detail: { location: file.location } 
          });
          window.dispatchEvent(refreshEvent);
          
          // Also dispatch a specific file-duplicated event that components can listen for
          const duplicatedEvent = new CustomEvent('file-duplicated', {
            detail: { originalFileId: fileId, newFileId: file.id, fileName: file.name }
          });
          window.dispatchEvent(duplicatedEvent);
          
          // Invalidate cache and dispatch storage change event for operations that affect storage usage
          this.invalidateStorageCache();
          window.dispatchEvent(new CustomEvent('storage-changed', {
            detail: { operation: 'duplicate', change: 'increase' }
          }));
              
        } catch (refreshError) {
          console.warn('Error refreshing file lists after duplication:', refreshError);
        }
        
      return file;
      } else {
        console.error('File duplication returned null or undefined result');
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
    }
  },

  /**
   * Move a file to bin
   */
  async moveToBin(fileId: string): Promise<void> {
    try {
      // Get minimal file details to avoid full database query
      const fileName = localStorage.getItem(`file_name_${fileId}`);
      
      // Start the move operation immediately
      const movePromise = fileGateway.moveToBin(fileId);
      
      // Clear cache immediately to prevent stale data
      localStorage.removeItem(`file_${fileId}`);
      
      // Dispatch refresh events for UI responsiveness
      window.dispatchEvent(new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      }));
      
      // Wait for the actual operation to complete
      await movePromise;
      
    } catch (error) {
      console.error('Error moving file to bin:', error);
    }
  },

  /**
   * Restore a file from bin
   */
  async restoreFromBin(fileId: string): Promise<void> {
    try {
      // Get minimal file details to avoid full database query
      const fileName = localStorage.getItem(`file_name_${fileId}`);
      
      // Start the restore operation immediately
      const restorePromise = fileGateway.restoreFromBin(fileId);
      
      // Clear cache immediately to prevent stale data
      localStorage.removeItem(`file_${fileId}`);
      
      // Dispatch refresh events for UI responsiveness
      window.dispatchEvent(new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      }));
      
      // Wait for the actual operation to complete
      await restorePromise;

    } catch (error) {
      // If the error is "not in trash", this is not a critical error
      if (error instanceof Error && error.message.includes('not in bin')) {
        console.log('File is not in bin, not showing error notification');
        return;
      }
      
      console.error('Error restoring file from bin:', error);
    }
  },

  /**
   * Delete a file permanently
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await fileGateway.deleteFile(fileId);
      
      // Dispatch refresh event to update Bin file list
      window.dispatchEvent(new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      }));
      
      // Dispatch bin emptied event
      window.dispatchEvent(new CustomEvent('file-deleted'));

      // Invalidate cache and dispatch storage change event for operations that affect storage usage
      this.invalidateStorageCache();
      window.dispatchEvent(new CustomEvent('storage-changed', {
        detail: { operation: 'delete', change: 'decrease' }
      }));

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  },

  /**
   * Empty the bin
   */
  async emptyBin(): Promise<boolean> {
    try {
      await fileGateway.emptyBin();
      
      // Dispatch refresh event to update Bin file list
      window.dispatchEvent(new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      }));
      
      // Dispatch bin emptied event
      window.dispatchEvent(new CustomEvent('bin-emptied'));
      
      // Invalidate cache and dispatch storage change event for operations that affect storage usage
      this.invalidateStorageCache();
      window.dispatchEvent(new CustomEvent('storage-changed', {
        detail: { operation: 'empty-bin', change: 'decrease' }
      }));
      
      return true;
    } catch (error) {
      console.error('Error emptying bin:', error);
    }
  },

  /**
   * Get files by location for listing (Drive or Bin)
   */
  async getFilesList(folderId: string | null = null, isBin: boolean = false): Promise<FileItem[]> {
    try {
      
      const files = await fileGateway.getFilesList(folderId, isBin);
      
      // Ensure we always return an array, even if the response is null or undefined
      if (!files || !Array.isArray(files)) {
        console.warn('Invalid response format from getFiles:', files);
        return [];
      }
      
      // Process and normalize the file items to ensure isFolder is properly set
      const processedFiles = files
        .filter(file => file !== null && file !== undefined)
        .map(file => {
          // Preserve the original file object but ensure isFolder is a boolean
          return {
            ...file,
            isFolder: Boolean(
              file.isFolder === true || 
              file.type === 'folder' || 
              file.mimeType === 'application/x-directory'
            )
          };
        });
      
      return processedFiles;
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  },

  /**
   * Get file details
   */
  async getFileProperties(fileId: string): Promise<FileItem | null> {
    try {
      const file = await fileGateway.getFileProperties(fileId);
      return file;
    } catch (error) {
      console.error('Error getting file details:', error);
      return null;
    }
  },

  /**
   * Get storage usage statistics
   */
  async getStorageStats(forceRefresh = false): Promise<StorageStats> {
    try {
      const response = await fileGateway.getStorageStats();
      const stats = response as unknown as ApiStorageStats;
      
      if (!stats) {
        throw new Error('Failed to get storage stats');
      }
      
      // Format stats to match our interface
      const formattedStats: StorageStats = {
        used: stats.storageUsed || 0,
        total: stats.storageLimit || 5368709120, // 5GB default
        percentage: stats.storageUsed && stats.storageLimit ? 
          (stats.storageUsed / stats.storageLimit) * 100 : 0,
        files: stats.fileCount || 0,
      };
      
      // Cache the results
      localStorage.setItem('storage_stats', JSON.stringify(formattedStats));
      localStorage.setItem('storage_stats_timestamp', Date.now().toString());
      
      return formattedStats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      
      // Only show notification if this was a user-initiated refresh
      if (forceRefresh) {
        console.error(error instanceof Error ? error.message : 'Failed to get storage stats');
      }
      
      
      // Return default values as last resort
      return {
        used: 0,
        total: 5368709120, // 5GB default
        percentage: 0,
        files: 0,
      };
    }
  },

  /**
   * Invalidate storage stats cache - use this before operations that change storage
   */
  invalidateStorageCache() {
    localStorage.removeItem('storage_stats');
    localStorage.removeItem('storage_stats_timestamp');
  },
}; 