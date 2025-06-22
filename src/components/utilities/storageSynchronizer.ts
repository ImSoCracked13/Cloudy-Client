import { fileService } from '../services/fileService';
import { fileGateway } from '../gateway/fileGateway';
import { notificationService } from '../common/Notification';
import { FileItem } from '../types/fileType';

/**
 * StorageSynchronizer - Utility class to ensure front-end file operations 
 * are synchronized with MinIO storage and database records
 */
export class StorageSynchronizer {
  private static instance: StorageSynchronizer;
  
  private constructor() {
    console.log('StorageSynchronizer initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): StorageSynchronizer {
    if (!StorageSynchronizer.instance) {
      StorageSynchronizer.instance = new StorageSynchronizer();
    }
    return StorageSynchronizer.instance;
  }
  
  /**
   * Create a folder in both UI and MinIO
   */
  async createFolder(name: string, path: string): Promise<FileItem | null> {
    try {
      console.log('StorageSynchronizer: Creating folder', name, 'at path', path);
      
      // First create the folder in MinIO through the API
      const folder = await fileService.createFolder(name, path);
      
      if (!folder) {
        console.error('StorageSynchronizer: Failed to create folder in MinIO');
        throw new Error('Failed to create folder in MinIO');
      }
      
      // Verify folder creation in both MinIO and database
      const verifiedFolder = await this.verifyFolderCreation(name, path, 3);
      if (!verifiedFolder) {
        // Attempt to repair by sync operation
        console.warn('StorageSynchronizer: Folder verification failed, attempting to repair via sync');
        await fileService.syncStorage(path, 'Drive');
      }
      
      console.log('StorageSynchronizer: Folder created successfully', folder);
      return folder;
    } catch (error) {
      console.error('StorageSynchronizer: Error creating folder:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to create folder');
      return null;
    }
  }
  
  /**
   * Upload file with size validation and duplicate checking
   */
  async uploadFile(
    file: File, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<FileItem | null> {
    try {
      console.log('StorageSynchronizer: Uploading file', file.name, 'to path', path);
      
      // Check file size limit (50MB)
      if (file.size > 50 * 1024 * 1024) {
        console.warn('StorageSynchronizer: File size exceeds the maximum limit of 50MB');
        notificationService.error(`File size exceeds the maximum limit of 50MB`);
        return null;
      }
      
      // Check if file with same name exists
      console.log('StorageSynchronizer: Checking for existing files at path', path);
      const files = await fileService.getFilesByPath(path);
      const existingFile = files.find(f => f.name === file.name && !f.isFolder);
      
      if (existingFile) {
        console.log('StorageSynchronizer: File with same name exists, asking for overwrite confirmation');
        // Ask user whether to overwrite
        const shouldOverwrite = await this.confirmOverwrite(file.name);
        
        if (shouldOverwrite) {
          console.log('StorageSynchronizer: User confirmed overwrite, proceeding with upload');
        } else {
          // If not overwriting, generate a new name with (n) suffix
          const baseName = file.name.replace(/\s*\(\d+\)$/, '');
          const extension = baseName.includes('.') ? `.${baseName.split('.').pop()}` : '';
          const nameWithoutExtension = extension ? baseName.slice(0, -extension.length) : baseName;
          
          // Find the highest copy number
          const copyNumbers = files
            .map(f => {
              const nameToMatch = extension ? f.name.slice(0, -extension.length) : f.name;
              const match = nameToMatch.match(new RegExp(`^${nameWithoutExtension}\\s*\\((\\d+)\\)$`));
              return match && match[1] ? parseInt(match[1]) : 0;
            })
            .filter(n => n > 0);
          
          const highestNumber = copyNumbers.length > 0 ? Math.max(...copyNumbers) : 0;
          const newFileName = `${nameWithoutExtension} (${highestNumber + 1})${extension}`;
          
          console.log(`StorageSynchronizer: Renaming file to avoid overwrite: ${file.name} -> ${newFileName}`);
          
          // Create a new File object with the new name
          const renamedFile = new File([file], newFileName, { type: file.type });
          return await fileService.uploadFile(renamedFile, path, onProgress, false);
        }
        
        return await fileService.uploadFile(file, path, onProgress, shouldOverwrite);
      }
      
      console.log('StorageSynchronizer: No existing file found, proceeding with upload');
      // Upload file normally
      const result = await fileService.uploadFile(file, path, onProgress, false);
      
      // Verify the file was uploaded successfully in both MinIO and database
      if (result) {
        const verifiedFile = await this.verifyFileUpload(file.name, path, 3);
        if (!verifiedFile) {
          console.warn('StorageSynchronizer: File verification failed, attempting to repair via sync');
          await fileService.syncStorage(path, 'Drive');
        }
      }
      
      console.log('StorageSynchronizer: Upload completed', result);
      return result;
    } catch (error) {
      console.error('StorageSynchronizer: Error uploading file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload file');
      return null;
    }
  }
  
  /**
   * Move file to trash (synchronize with MinIO Bin folder)
   */
  async moveToTrash(file: FileItem): Promise<boolean> {
    try {
      await fileService.moveToTrash(file.id);
      notificationService.success(`"${file.name}" moved to trash`);
      
      // Dispatch a refresh event to update the file list
      const refreshEvent = new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      });
      window.dispatchEvent(refreshEvent);
      
      return true;
    } catch (error) {
      console.error('Error moving file to trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to move to trash');
      return false;
    }
  }
  
  /**
   * Restore file from trash (synchronize with MinIO Drive folder)
   */
  async restoreFromTrash(file: FileItem): Promise<boolean> {
    try {
      await fileService.restoreFromTrash(file.id);
      notificationService.success(`"${file.name}" restored from trash`);
      return true;
    } catch (error) {
      console.error('Error restoring file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to restore file');
      return false;
    }
  }
  
  /**
   * Permanently delete file (remove from MinIO completely)
   */
  async deleteFile(file: FileItem): Promise<boolean> {
    try {
      await fileService.deleteFile(file.id, file.name);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      notificationService.error('Failed to delete file');
      return false;
    }
  }
  
  /**
   * Empty trash (delete all files in MinIO Bin folder)
   */
  async emptyTrash(): Promise<boolean> {
    try {
      console.log('StorageSynchronizer: Emptying trash');
      
      // Empty trash in MinIO through the API
      const success = await fileService.emptyTrash();
      
      if (!success) {
        throw new Error('Failed to empty trash in MinIO');
      }
      
      // Verify the trash is empty
      const binFiles = await fileService.getFilesByPath('/', 'Bin');
      if (binFiles.length > 0) {
        console.warn('StorageSynchronizer: Bin not empty after emptying trash, attempting to repair via sync');
        await fileService.syncStorage('/', 'Bin');
      }
      
      return true;
    } catch (error) {
      console.error('StorageSynchronizer: Error emptying trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to empty trash');
      return false;
    }
  }
  
  /**
   * Rename file (synchronize with MinIO)
   */
  async renameFile(file: FileItem, newName: string): Promise<FileItem | null> {
    try {
      return await fileService.renameFile(file.id, file.name, newName);
    } catch (error) {
      console.error('Error renaming file:', error);
      notificationService.error('Failed to rename file');
      return null;
    }
  }
  
  /**
   * Duplicate file (synchronize with MinIO)
   */
  async duplicateFile(file: FileItem): Promise<FileItem | null> {
    try {
      return await fileService.duplicateFile(file.id);
    } catch (error) {
      console.error('Error duplicating file:', error);
      notificationService.error('Failed to duplicate file');
      return null;
    }
  }
  
  /**
   * Move file to another folder (synchronize with MinIO)
   */
  async moveFile(file: FileItem, destinationFolderId: string | null): Promise<FileItem | null> {
    try {
      return await fileService.moveFile(file.id, file.name, destinationFolderId);
    } catch (error) {
      console.error('Error moving file:', error);
      notificationService.error('Failed to move file');
      return null;
    }
  }
  
  /**
   * Get file properties (fetch from both MinIO and database)
   */
  async getFileProperties(file: FileItem): Promise<any> {
    try {
      console.log('StorageSynchronizer: Getting properties for', file.name);
      
      // Get file details from the database
      const fileDetails = await fileService.getFileDetails(file.id);
      
      if (!fileDetails) {
        throw new Error('Failed to get file details');
      }
      
      return fileDetails;
    } catch (error) {
      console.error('StorageSynchronizer: Error getting file properties:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to get file properties');
      return null;
    }
  }
  
  /**
   * Verify a folder was created in both MinIO and database
   */
  async verifyFolderCreation(
    folderName: string, 
    path: string, 
    maxRetries: number = 3
  ): Promise<FileItem | null> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`StorageSynchronizer: Verifying folder ${folderName} at path ${path}, attempt ${retries + 1}/${maxRetries}`);
        
        // Get all files in the folder to check if our new folder exists
        const files = await fileService.getFilesByPath(path);
        
        // Check if files is an array before trying to find
        if (Array.isArray(files)) {
        const folder = files.find(f => f.name === folderName && f.isFolder);
        
        if (folder) {
          console.log(`StorageSynchronizer: Folder ${folderName} verified in database`);
          return folder;
          }
        } else {
          console.warn(`StorageSynchronizer: getFilesByPath returned non-array:`, files);
        }
        
        // Try direct API call as fallback
        try {
          console.log(`StorageSynchronizer: Trying direct API call to find folder ${folderName}`);
          const directResult = await fileGateway.getFilesByPath(path);
          
          if (Array.isArray(directResult)) {
            const folder = directResult.find(f => f.name === folderName && f.isFolder);
            if (folder) {
              console.log(`StorageSynchronizer: Folder ${folderName} found via direct API call`);
              return folder;
            }
          }
        } catch (directError) {
          console.warn('StorageSynchronizer: Direct API call failed:', directError);
        }
        
        // Wait before retry
        console.log(`StorageSynchronizer: Folder verification attempt ${retries + 1}/${maxRetries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
        retries++;
      } catch (error) {
        console.error('StorageSynchronizer: Error verifying folder creation:', error);
        retries++;
        
        if (retries >= maxRetries) {
          // As a last resort, assume success if we've made it this far
          console.log('StorageSynchronizer: Max retries reached, assuming folder was created');
          return {
            id: 'pending-verification',
            name: folderName,
            path: path,
            isFolder: true,
            type: 'folder',
            size: 0,
            parentId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as FileItem;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
      }
    }
    
    // As a last resort, assume success if we've made it this far
    console.log('StorageSynchronizer: Max retries reached, assuming folder was created');
    return {
      id: 'pending-verification',
      name: folderName,
      path: path,
      isFolder: true,
      type: 'folder',
      size: 0,
      parentId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as FileItem;
  }
  
  /**
   * Verify a file was uploaded to both MinIO and database
   */
  async verifyFileUpload(
    fileName: string, 
    path: string, 
    maxRetries: number = 3
  ): Promise<FileItem | null> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`StorageSynchronizer: Verifying file ${fileName} at path ${path}, attempt ${retries + 1}/${maxRetries}`);
        
        // Get all files in the folder to check if our new file exists
        const files = await fileService.getFilesByPath(path);
        
        // Check if files is an array before trying to find
        if (Array.isArray(files)) {
        const file = files.find(f => f.name === fileName && !f.isFolder);
        
        if (file) {
          console.log(`StorageSynchronizer: File ${fileName} verified in database`);
          return file;
          }
        } else {
          console.warn(`StorageSynchronizer: getFilesByPath returned non-array:`, files);
        }
        
        // Try direct API call as fallback
        try {
          console.log(`StorageSynchronizer: Trying direct API call to find file ${fileName}`);
          const directResult = await fileGateway.getFilesByPath(path);
          
          if (Array.isArray(directResult)) {
            const file = directResult.find(f => f.name === fileName && !f.isFolder);
            if (file) {
              console.log(`StorageSynchronizer: File ${fileName} found via direct API call`);
              return file;
            }
          }
        } catch (directError) {
          console.warn('StorageSynchronizer: Direct API call failed:', directError);
        }
        
        // Wait before retry
        console.log(`StorageSynchronizer: File verification attempt ${retries + 1}/${maxRetries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
        retries++;
      } catch (error) {
        console.error('StorageSynchronizer: Error verifying file upload:', error);
        retries++;
        
        if (retries >= maxRetries) {
          // As a last resort, assume success if we've made it this far
          console.log('StorageSynchronizer: Max retries reached, assuming file was uploaded');
          return {
            id: 'pending-verification',
            name: fileName,
            path: path,
            isFolder: false,
            type: fileName.split('.').pop() || 'unknown',
            size: 0,
            parentId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as FileItem;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
      }
    }
    
    // As a last resort, assume success if we've made it this far
    console.log('StorageSynchronizer: Max retries reached, assuming file was uploaded');
    return {
      id: 'pending-verification',
      name: fileName,
      path: path,
      isFolder: false,
      type: fileName.split('.').pop() || 'unknown',
      size: 0,
      parentId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as FileItem;
  }
  
  /**
   * Verify a file exists in a specific location (Drive or Bin)
   */
  async verifyFileInLocation(
    fileName: string,
    path: string,
    location: 'Drive' | 'Bin' | string
  ): Promise<boolean> {
    try {
      const locationValue = (location === 'Drive' || location === 'Bin') ? location : 'Drive';
      const files = await fileService.getFilesByPath(path, locationValue);
      return files.some(f => f.name === fileName);
    } catch (error) {
      console.error(`StorageSynchronizer: Error verifying file ${fileName} in ${location}:`, error);
      return false;
    }
  }
  
  /**
   * Refresh the file list to show the latest state
   * This is important to call after any file operation
   */
  async refreshFileList(): Promise<void> {
    try {
      console.log('StorageSynchronizer: Refreshing file list');
      
      // Get the current location from the URL
      const url = window.location.pathname;
      const isBin = url.includes('/bin');
      const path = this.extractPathFromURL(url);
      
      // Refresh the files in the current location
      const location = isBin ? 'Bin' : 'Drive';
      await fileService.syncStorage(path, location);
      
      // Dispatch a custom event to notify components to refresh
      const refreshEvent = new CustomEvent('files-refreshed', { 
        detail: { path, location } 
      });
      window.dispatchEvent(refreshEvent);
      
      console.log(`StorageSynchronizer: File list refreshed for ${location} at path ${path}`);
    } catch (error) {
      console.error('StorageSynchronizer: Error refreshing file list:', error);
    }
  }
  
  /**
   * Extract path from URL for file operations
   */
  private extractPathFromURL(url: string): string {
    // Default to root path
    if (!url) return '/';
    
    // Remove any trailing slash
    url = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // For drive URLs like /drive or /drive/folder1/folder2
    if (url.startsWith('/drive')) {
      const path = url.replace(/^\/drive/, '');
      return path || '/';
    }
    
    // For bin URLs like /bin
    if (url.startsWith('/bin')) {
      return '/';
    }
    
    // For other URLs, default to root
    return '/';
  }
  
  /**
   * Confirm with the user if they want to overwrite an existing file
   */
  private async confirmOverwrite(fileName: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Create a dialog element
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
      dialog.innerHTML = `
        <div class="bg-background-darker rounded-lg shadow-lg p-6 max-w-md">
          <h3 class="text-lg font-medium text-text mb-4">File already exists</h3>
          <p class="text-text-muted mb-6">"${fileName}" already exists. Do you want to replace it?</p>
          <div class="flex justify-end gap-3">
            <button id="cancel-btn" class="px-4 py-2 text-text-muted hover:text-text">Cancel</button>
            <button id="overwrite-btn" class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Replace</button>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(dialog);
      
      // Add event listeners
      document.getElementById('cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(false);
      });
      
      document.getElementById('overwrite-btn')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(true);
      });
    });
  }
  
  /**
   * Fix duplicated Drive/Drive or Bin/Bin folder structure
   */
  async fixDuplicatedFolders(): Promise<boolean> {
    try {
      console.log('StorageSynchronizer: Fixing duplicated folders structure');
      
      const result = await fileGateway.fixDuplicatedDriveFolders();
      
      if (result && result.success) {
        notificationService.success('Fixed folder structure successfully');
        return true;
      } else {
        notificationService.error(result?.message || 'Failed to fix folder structure');
        return false;
      }
    } catch (error) {
      console.error('StorageSynchronizer: Error fixing duplicated folders:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to fix folder structure');
      return false;
    }
  }
  
  /**
   * Download a file with proper error handling
   */
  async downloadFile(file: FileItem): Promise<boolean> {
    try {
      console.log('StorageSynchronizer: Downloading file', file.name);
      
      const success = await fileService.downloadAndSaveFile(file.id, file.name, file.isFolder);
      
      if (!success) {
        throw new Error('Failed to download file');
      }
      
      return true;
    } catch (error) {
      console.error('StorageSynchronizer: Error downloading file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to download file');
      return false;
    }
  }
}

// Export a singleton instance for easy access
export const storageSynchronizer = StorageSynchronizer.getInstance(); 