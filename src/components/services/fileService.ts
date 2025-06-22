import { FileItem, FileOperationResult, StorageStats, FilePreviewData, FilePreviewDto } from '../types/fileType';
import { notificationService } from '../common/Notification';
import { fileGateway } from '../gateway/fileGateway';
import { formatFileSize } from '../utilities/fileSizeFormatter';


/**
 * Map preview type string to FilePreviewData type
 */
function mapPreviewType(type: string): 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'other' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('text/')) return 'text';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  return 'other';
}

/**
 * File Service - Handles file operations business logic
 */
export const fileService = {
  /**
   * Get files by path and location
   */
  async getFilesByPath(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    try {
      // Try to get files from server
      const files = await fileGateway.getFilesByPath(path, location);
      
      // Ensure we always return an array, even if the response is null or undefined
      if (!files || !Array.isArray(files)) {
        console.warn('Invalid response format from getFilesByPath:', files);
        return [];
      }
      
      // Filter out any null or undefined items that might be in the array
      return files.filter(file => file !== null && file !== undefined);
    } catch (error) {
      console.error('Error fetching files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to fetch files');
      return [];
    }
  },

  /**
   * Get files by location (Drive or Trash)
   */
  async getFiles(folderId: string | null = null, isTrashed: boolean = false): Promise<FileItem[]> {
    try {
      const files = await fileGateway.getFiles(folderId, isTrashed);
      
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
      notificationService.error(error instanceof Error ? error.message : 'Failed to fetch files');
      return [];
    }
  },

  /**
   * Get file details
   */
  async getFileDetails(fileId: string): Promise<FileItem | null> {
    try {
      return await fileGateway.getFileDetails(fileId);
    } catch (error) {
      console.error('Error fetching file details:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get file details');
      return null;
    }
  },

  /**
   * Create a new folder
   */
  async createFolder(name: string, path: string = '/', overwrite: boolean = false): Promise<FileItem | null> {
    try {
      // Validate input
      if (!name || name.trim() === '') {
        notificationService.error('Folder name cannot be empty');
        return null;
      }
      
      console.log(`Creating folder "${name}" at path "${path}" with overwrite=${overwrite}`);
      
      // Create folder on server
      const folder = await fileGateway.createFolder(name, path, overwrite);
      
      // Log the folder response
      console.log('Server response for folder creation:', folder);
      
      // If we have a valid folder response with ID, consider it a success
      if (folder && folder.id) {
        notificationService.success(`Folder "${name}" created successfully`);
        return folder;
      } else {
        throw new Error('Failed to create folder: Invalid server response');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to create folder');
      return null;
    }
  },

  /**
   * Upload a file to the server
   */
  async uploadFile(
    file: File, 
    parentId?: string | null, 
    onProgress?: (progress: number) => void,
    overwrite: boolean = false
  ): Promise<FileItem> {
    try {
      return await fileGateway.uploadFile(file, parentId || null, onProgress, overwrite);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string, fileName: string, isFolder: boolean = false): Promise<Blob> {
    try {
      if (isFolder) {
        return await fileGateway.downloadFolder(fileId, fileName);
      } else {
        return await fileGateway.downloadFile(fileId, fileName);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to download file');
      throw error;
    }
  },

  /**
   * Download a folder as ZIP
   */
  async downloadFolder(fileId: string, folderName: string): Promise<Blob> {
    try {
      const blob = await fileGateway.downloadFolder(fileId, folderName);
      return blob;
    } catch (error) {
      console.error('Error downloading folder:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to download folder');
      throw error;
    }
  },

  /**
   * Download and save a file
   */
  async downloadAndSaveFile(fileId: string, fileName: string, isFolder: boolean = false): Promise<boolean> {
    try {
      let blob;
      
      if (isFolder) {
        blob = await fileGateway.downloadFolder(fileId, fileName);
        fileName = `${fileName}.zip`;
      } else {
        blob = await fileGateway.downloadFile(fileId, fileName);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to download file');
      return false;
    }
  },

  /**
   * Move a file to trash
   */
  async moveToTrash(fileId: string): Promise<void> {
    try {
      const response = await fileGateway.moveToTrash(fileId);
      notificationService.success(`File moved to trash successfully`);
    } catch (error) {
      // If the error is "already in trash", this is not a critical error
      if (error instanceof Error && error.message.includes('already in trash')) {
        console.log('File is already in trash, not showing error notification');
        // Don't show an error notification
        return;
      }
      
      console.error('Error moving file to trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to move file to trash');
      throw error;
    }
  },

  /**
   * Restore a file from trash
   */
  async restoreFromTrash(fileId: string): Promise<void> {
    try {
      const response = await fileGateway.restoreFromTrash(fileId);
      notificationService.success(`File restored from trash successfully`);
      
      // Dispatch a refresh event to update both Drive and Bin file lists
      const refreshEventBin = new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      });
      window.dispatchEvent(refreshEventBin);
      
      const refreshEventDrive = new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      });
      window.dispatchEvent(refreshEventDrive);
      
    } catch (error) {
      // If the error is "already in Drive", this is not a critical error
      if (error instanceof Error && error.message.includes('already in Drive')) {
        console.log('File is already in Drive, not showing error notification');
        // Don't show an error notification
        return;
      }
      
      console.error('Error restoring file from trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to restore file from trash');
      throw error;
    }
  },

  /**
   * Delete a file permanently
   */
  async deleteFile(fileId: string, fileName: string): Promise<boolean> {
    try {
      await fileGateway.deleteFile(fileId);
      return true;
    } catch (error) {
      // If the error indicates the file doesn't exist in storage,
      // we still want to delete the database record
      if (error instanceof Error && error.message.includes('NotFound')) {
        console.warn('File not found in storage, proceeding with database cleanup');
        try {
          await fileGateway.deleteFile(fileId);
          return true;
        } catch (innerError) {
          console.error('Error deleting database record:', innerError);
          throw innerError;
        }
      }
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Rename a file
   */
  async renameFile(fileId: string, oldName: string, newName: string): Promise<FileItem | null> {
    try {
      // Make sure we preserve file extension for non-folder files
      // If oldName has an extension and newName doesn't have the same extension, add it
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
        notificationService.success(`"${oldName}" renamed to "${newName}"`);
      }
      return file;
    } catch (error) {
      console.error('Error renaming file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to rename file');
      return null;
    }
  },

  /**
   * Move a file to another folder
   */
  async moveFile(fileId: string, fileName: string, destinationFolderId: string | null): Promise<FileItem | null> {
    try {
      const file = await fileGateway.moveFile(fileId, destinationFolderId);
      notificationService.success(`"${fileName}" moved successfully`);
      return file;
    } catch (error) {
      console.error('Error moving file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to move file');
      return null;
    }
  },

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string): Promise<FileItem | null> {
    try {
      const file = await fileGateway.duplicateFile(fileId);
      notificationService.success(`File duplicated successfully`);
      return file;
    } catch (error) {
      console.error('Error duplicating file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to duplicate file');
      return null;
    }
  },

  /**
   * Search files
   */
  async searchFiles(query: string, isTrashed: boolean = false): Promise<FileItem[]> {
    try {
      const files = await fileGateway.searchFiles(query, isTrashed);
      
      // Ensure we always return an array, even if the response is null or undefined
      if (!files || !Array.isArray(files)) {
        console.warn('Invalid response format from searchFiles:', files);
        return [];
      }
      
      // Filter out any null or undefined items that might be in the array
      return files.filter(file => file !== null && file !== undefined);
    } catch (error) {
      console.error('Error searching files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to search files');
      return [];
    }
  },

  /**
   * Get file preview data
   */
  async getFilePreview(fileId: string): Promise<FilePreviewData | null> {
    try {
      const preview = await fileGateway.getFilePreview(fileId);
      
      if (!preview) {
        return null;
      }
      
      // The preview data is nested inside the data property from the response
      const previewData = preview.data || preview;
      
      return {
        type: previewData.type || 'other',
        url: previewData.url || '',
        name: previewData.name || '',
        size: previewData.size || 0,
        content: previewData.content
      };
    } catch (error) {
      console.error('Error getting file preview:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get file preview');
      return null;
    }
  },

  /**
   * Get a temporary URL for a file
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    try {
      return await fileGateway.getFileUrl(fileId);
    } catch (error) {
      console.error('Error getting file URL:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get file URL');
      return null;
    }
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      return await fileGateway.getStorageStats();
    } catch (error) {
      console.error('Error getting storage statistics:', error);
      // Return default stats with formatted values
      const defaultUsed = 0;
      const defaultLimit = 1024 * 1024 * 1024 * 5; // 5GB default
      return {
        used: defaultUsed,
        limit: defaultLimit,
        percentage: 0,
        formattedUsed: formatFileSize(defaultUsed),
        formattedLimit: formatFileSize(defaultLimit)
      };
    }
  },

  /**
   * Empty the trash bin
   */
  async emptyTrash(): Promise<boolean> {
    try {
      await fileGateway.emptyTrash();
      
      // Dispatch refresh event to update Bin file list
      const refreshEvent = new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      });
      window.dispatchEvent(refreshEvent);
      
      notificationService.success('Bin emptied successfully');
      return true;
    } catch (error) {
      // If the error indicates files don't exist in storage,
      // we still want to proceed with database cleanup
      if (error instanceof Error && error.message.includes('NotFound')) {
        console.warn('Some files not found in storage, proceeding with database cleanup');
        try {
          await fileGateway.emptyTrash();
          
          // Dispatch refresh event to update Bin file list
          const refreshEvent = new CustomEvent('files-refreshed', { 
            detail: { location: 'Bin' } 
          });
          window.dispatchEvent(refreshEvent);
          
          notificationService.success('Bin emptied successfully');
          return true;
        } catch (innerError) {
          console.error('Error cleaning up database:', innerError);
          notificationService.error('Failed to empty bin');
          throw innerError;
        }
      }
      console.error('Error emptying trash:', error);
      notificationService.error('Failed to empty bin');
      throw error;
    }
  },

  /**
   * Check if files with the given names already exist in the specified folder
   */
  async checkExistingFiles(fileNames: string[], folderId: string | null): Promise<string[]> {
    try {
      // Get all files in the current folder
      const files = await this.getFiles(folderId, false);
      
      // Check which file names already exist
      const existingFileNames = fileNames.filter(name => 
        files.some(file => file.name === name)
      );
      
      return existingFileNames;
    } catch (error) {
      console.error('Error checking for existing files:', error);
      throw error;
    }
  },

  /**
   * Synchronize storage - ensures MinIO and database are in sync
   * Used to fix inconsistencies between storage and database records
   */
  async syncStorage(path: string = '/', location: string = 'Drive'): Promise<boolean> {
    try {
      console.log(`Synchronizing storage at path ${path}, location ${location}`);
      const result = await fileGateway.syncStorage(path, location);
      
      if (result && result.success) {
        notificationService.success('Storage synchronized successfully');
        console.log('Synchronization results:', result.data);
        return true;
      } else {
        const message = result?.message || 'Failed to synchronize storage';
        console.error('Sync failed:', message);
        notificationService.error(message);
        return false;
      }
    } catch (error) {
      console.error('Error synchronizing storage:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to synchronize storage');
      return false;
    }
  },

  /**
   * Restore all files from trash
   */
  async restoreAllFromTrash(): Promise<boolean> {
    try {
      await fileGateway.restoreAllFromTrash();
      
      // Dispatch a refresh event to update both Drive and Bin file lists
      const refreshEventBin = new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      });
      window.dispatchEvent(refreshEventBin);
      
      const refreshEventDrive = new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      });
      window.dispatchEvent(refreshEventDrive);
      
      return true;
    } catch (error) {
      console.error('Error restoring all files from trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to restore all files from trash');
      return false;
    }
  },
}; 