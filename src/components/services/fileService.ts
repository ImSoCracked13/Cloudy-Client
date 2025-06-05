import { FileItem, FileOperationResult, StorageStats } from '../types/file';
import { notificationService } from '../common/Notification';
import { fileGateway } from '../gateway/fileGateway';
import { formatFileSize } from '../utilities/formatFileSize';
import { FilePreviewData } from '../types/file';

// Use mock API for development
const USE_MOCK_API = false;

/**
 * File Service - Handles file operations business logic
 */
export const fileService = {
  /**
   * Get files by path and location
   */
  async getFilesByPath(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    try {
      return await fileGateway.getFilesByPath(path, location);
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
      return await fileGateway.getFiles(folderId, isTrashed);
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
  async createFolder(name: string, path: string = '/'): Promise<FileItem | null> {
    try {
      const folder = await fileGateway.createFolder(name, path);
      notificationService.success(`Folder "${name}" created successfully`);
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to create folder');
      return null;
    }
  },

  /**
   * Upload a file with progress tracking
   */
  async uploadFile(
    file: File, 
    path: string = '/',
    onProgress?: (progress: number) => void,
    overwriteIfExists: boolean = false
  ): Promise<FileItem | null> {
    try {
      const uploadedFile = await fileGateway.uploadFile(file, path, onProgress, overwriteIfExists);
      notificationService.success(`"${file.name}" uploaded successfully`);
      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload file');
      return null;
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
  async moveToTrash(fileId: string, fileName: string): Promise<boolean> {
    try {
      await fileGateway.moveToTrash(fileId);
      notificationService.success(`"${fileName}" moved to trash`);
      return true;
    } catch (error) {
      console.error('Error moving file to trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to move to trash');
      return false;
    }
  },

  /**
   * Restore a file from trash
   */
  async restoreFromTrash(fileId: string, fileName: string): Promise<boolean> {
    try {
      await fileGateway.restoreFromTrash(fileId);
      notificationService.success(`"${fileName}" restored from trash`);
      return true;
    } catch (error) {
      console.error('Error restoring from trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to restore from trash');
      return false;
    }
  },

  /**
   * Permanently delete a file
   */
  async deleteFile(fileId: string, fileName: string): Promise<boolean> {
    try {
      await fileGateway.deleteFile(fileId);
      notificationService.success(`"${fileName}" permanently deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to delete file');
      return false;
    }
  },

  /**
   * Rename a file
   */
  async renameFile(fileId: string, oldName: string, newName: string): Promise<FileItem | null> {
    try {
      const file = await fileGateway.renameFile(fileId, newName);
      notificationService.success(`"${oldName}" renamed to "${newName}"`);
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
  async duplicateFile(fileId: string, fileName: string): Promise<FileItem | null> {
    try {
      const file = await fileGateway.duplicateFile(fileId);
      notificationService.success(`"${fileName}" duplicated successfully`);
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
      return await fileGateway.searchFiles(query, isTrashed);
    } catch (error) {
      console.error('Error searching files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to search files');
      return [];
    }
  },

  /**
   * Get file preview
   */
  async getFilePreview(fileId: string): Promise<FilePreviewData | null> {
    try {
      const preview = await fileGateway.getFilePreview(fileId);
      // Convert the string type to the proper enum type
      const previewData: FilePreviewData = {
        url: preview.url,
        type: preview.type as any, // Cast to any as a workaround
        name: preview.name,
        size: preview.size,
        content: preview.content
      };
      return previewData;
    } catch (error) {
      console.error('Error getting file preview:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get file preview');
      return null;
    }
  },

  /**
   * Get file URL for direct access
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
      const stats = await fileGateway.getStorageStats();
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get storage statistics');
      throw error;
    }
  },

  /**
   * Empty trash bin
   */
  async emptyTrash(): Promise<boolean> {
    try {
      await fileGateway.emptyTrash();
      notificationService.success('Trash emptied successfully');
      return true;
    } catch (error) {
      console.error('Error emptying trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to empty trash');
      return false;
    }
  }
}; 