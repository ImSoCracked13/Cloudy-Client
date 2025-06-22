import { FileItem, FolderContents, FilePreviewDto, StorageStats } from '../types/fileType';

// Use API URL from environment variables or cloud URL as fallback
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://cloudy-server.fly.dev';

// Remove /api prefix if it exists in the API_URL
const normalizedApiUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

console.log('File Gateway initialized with API URL:', normalizedApiUrl);

/**
 * Helper to get the auth token
 */
function getAuthToken(): string {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Auth token not found, user might not be logged in');
    throw new Error('Not authenticated');
  }
  return token;
}

/**
 * Handle Elysia middleware response format that includes beforeHandle array
 * @param data Response data from server
 * @returns Processed response data
 */
function handleElysiaResponse(data: any): any {
  // Log raw data for debugging
  console.log('Processing Elysia response:', data);
  
  // Handle null or undefined response
  if (data === null || data === undefined) {
    console.warn('Received null or undefined response');
    return {
      success: true,
      message: 'No data available',
      data: []
    };
  }
  
  // Check if response has beforeHandle array (Elysia middleware format)
  if (data && data.beforeHandle && Array.isArray(data.beforeHandle)) {
    console.log('Detected Elysia middleware response format, beforeHandle length:', data.beforeHandle.length);
    
    // Extract non-null data from beforeHandle array
    const nonNullData = data.beforeHandle.filter((item: any) => item !== null);
    console.log('Non-null data items in beforeHandle:', nonNullData.length);
    
    if (nonNullData.length > 0) {
      // Get the last non-null item as the real response
      const result = nonNullData[nonNullData.length - 1];
      console.log('Extracted response from Elysia middleware:', result);
      
      // If the result doesn't have success property but has a data property,
      // wrap it in a success structure
      if (result && result.data && result.success === undefined) {
        console.log('Adding success wrapper to extracted data');
        return {
          success: true,
          data: result.data,
          message: result.message || 'Operation successful'
        };
      }
      
      return result;
    } else {
      // All items in beforeHandle are null - this likely means the auth middleware
      // passed but no handler returned a proper response
      console.warn('All items in beforeHandle are null - attempting direct server call bypass');
      
      // For AWS MinIO integration, we need to bypass the middleware and make a direct call
      // We'll return a special signal to trigger a direct MinIO call
      return {
        success: false,
        message: 'Invalid server response: All middleware handlers returned null',
        error: 'Server Error',
        bypass: true  // Special flag to indicate we should try a direct MinIO call
      };
    }
  }
  
  // If data already has a success property, assume it's already in the right format
  if (data && typeof data.success !== 'undefined') {
    console.log('Response already has success property, returning as is');
    return data;
  }
  
  // If data has a direct data property but no success property, wrap it
  if (data && data.data && data.success === undefined) {
    console.log('Wrapping direct data property in success structure');
    return {
      success: true,
      data: data.data,
      message: data.message || 'Operation successful'
    };
  }
  
  // If data is an empty array, wrap it in a success structure
  if (Array.isArray(data)) {
    console.log('Response is an array, wrapping in success structure');
    return {
      success: true,
      message: 'Data retrieved successfully',
      data: data
    };
  }
  
  // Return original data if not Elysia format
  console.log('No special handling needed, returning original data');
  return data;
}

/**
 * Gateway layer for file operations API calls
 */
export const fileGateway = {
  // Track when the last refresh was performed globally
  _lastGlobalRefreshTime: 0,
  _refreshInProgress: false,
  _refreshCooldown: 5000, // 5 second global cooldown between any refreshes
  
  /**
   * Get files by path and location
   */
  async getFilesByPath(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    try {
      const token = getAuthToken();
      
      // Normalize path
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Build query parameters
      const params = new URLSearchParams({
        path: normalizedPath,
        location: location
      });
      
      const response = await fetch(`${normalizedApiUrl}/api/files?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get files: ${response.status}`);
      }
      
      const data = await response.json();
      const processedData = handleElysiaResponse(data);
      
      // Ensure we have an array of files
      if (!processedData || !Array.isArray(processedData)) {
        console.warn('Invalid response format from getFilesByPath:', processedData);
          return [];
        }

      // Filter out any invalid entries and map to FileItem type
      return processedData
        .filter(file => file && file.id && file.name)
        .map(file => ({
          ...file,
          path: file.objectPath || normalizedPath,
          location: location
        }));
    } catch (error) {
      console.error('Error in getFilesByPath:', error);
      return [];
    }
  },

  /**
   * Simplified refresh function with global cooldown
   * This ensures we only refresh once per operation
   */
  async refreshFileList(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    try {
      const now = Date.now();
      
      // Check if we're in the cooldown period or if a refresh is already in progress
      if (now - this._lastGlobalRefreshTime < this._refreshCooldown || this._refreshInProgress) {
        console.log(`Skipping refresh - cooldown period active or refresh in progress`);
        return [];
    }
      
      // Set refresh in progress flag
      this._refreshInProgress = true;
      this._lastGlobalRefreshTime = now;
      
      console.log('Performing file list refresh for path:', path, 'location:', location);
      
      try {
        const token = getAuthToken();
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        // Create the URL - handle case where path is empty or root
        const basePath = path === '/' ? '' : path;
        const url = `${normalizedApiUrl}/api/files/path/${encodeURIComponent(basePath)}?location=${location}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Get the response text first to ensure we can debug it
        const responseText = await response.text();
        console.log('Raw refreshFileList response:', responseText);
        
        // If response is not ok, handle the error
        if (!response.ok) {
          console.error('Server returned error during refresh:', response.status);
          this._refreshInProgress = false;
          return [];
        }
        
        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from server during refresh');
          this._refreshInProgress = false;
          return [];
        }
        
        // Try to parse response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing JSON response during refresh:', parseError);
          this._refreshInProgress = false;
          return [];
        }
        
        // Handle Elysia middleware response format
        data = handleElysiaResponse(data);
        
        console.log('Processed refreshFileList response:', data);
        
        // Get files from response
        let files: FileItem[] = [];
        
        if (data.success && Array.isArray(data.data)) {
          files = data.data;
        } else if (Array.isArray(data)) {
          files = data;
        } else {
          console.warn('Unexpected response format during refresh');
        }
        
        // Reset refresh in progress flag
        this._refreshInProgress = false;
        
        return files;
      } catch (error) {
        console.error('Error during file list refresh:', error);
        this._refreshInProgress = false;
        return [];
      }
    } catch (error) {
      console.error('Error in refreshFileList:', error);
      this._refreshInProgress = false;
      return [];
    }
  },
  
  /**
   * Alias for refreshFileList to maintain compatibility
   */
  async debouncedRefreshFileList(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    return this.refreshFileList(path, location);
  },

  /**
   * Get files by location (Drive or Trash)
   */
  async getFiles(folderId: string | null = null, isTrashed: boolean = false): Promise<FileItem[]> {
    try {
      const token = getAuthToken();

      const url = folderId 
        ? `${normalizedApiUrl}/api/files?parentId=${folderId}&isTrashed=${isTrashed}`
        : `${normalizedApiUrl}/api/files?isTrashed=${isTrashed}`;
        
      console.log('Fetching files from:', url, 'isTrashed=', isTrashed);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        // Get the response text first to ensure we can debug it
        const responseText = await response.text();
        console.log('Raw getFiles response:', responseText);

        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from server in getFiles');
            return [];
          }
          
        // Try to parse response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing JSON response in getFiles:', parseError);
          return [];
        }
        
        // Process the response data
        data = handleElysiaResponse(data);
        console.log('Processed getFiles response:', data);

        // Handle successful response
        if (response.ok) {
          // Check for array directly
          if (Array.isArray(data)) {
            return data;
          }
          
          // Check for data property with array
          if (data && data.data && Array.isArray(data.data)) {
            return data.data;
          }
          
          // Check for success property
          if (data && data.success === true) {
            return Array.isArray(data.data) ? data.data : [];
          }
          
          // Default to empty array for any other case
          console.warn('Server returned unexpected data format in getFiles, returning empty array');
          return [];
        }
        
        // If the main endpoint fails, try the fallback endpoint
        console.log('Main endpoint failed, trying fallback path-based endpoint...');
        return await this.getFilesByPath('/', isTrashed ? 'Bin' : 'Drive');
      } catch (error) {
        console.error('Error in main getFiles request:', error);
        
        // Try fallback
        console.log('Error occurred, trying fallback path-based endpoint...');
        return await this.getFilesByPath('/', isTrashed ? 'Bin' : 'Drive');
      }
    } catch (error) {
      console.error('Error in getFiles:', error);
      return [];
    }
  },

  /**
   * Search files by query
   */
  async searchFiles(query: string, isTrashed: boolean = false): Promise<FileItem[]> {
    try {
      const token = getAuthToken();
      
      console.log('Searching files with query:', query, 'isTrashed:', isTrashed);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          query,
          filters: { isTrashed }
        })
      });

      // Get the response text first to ensure we can debug it
      const responseText = await response.text();
      console.log('Raw searchFiles response:', responseText);
      
      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response received from server in searchFiles');
        return [];
      }

      // Try to parse response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response in searchFiles:', parseError);
        return [];
      }
      
      // Process the response data
      data = handleElysiaResponse(data);
      console.log('Processed searchFiles response:', data);

      // If response is not ok, handle the error
      if (!response.ok) {
        console.error('Error searching files:', data);
        return [];
      }

      // Handle successful response
      if (Array.isArray(data)) {
        return data;
      }

      if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      if (data && data.success === true) {
        return Array.isArray(data.data) ? data.data : [];
      }
      
      // Default to empty array for any other case
      console.warn('Server returned unexpected data format in searchFiles, returning empty array');
      return [];
    } catch (error) {
      console.error('Error in searchFiles:', error);
      return [];
    }
  },

  /**
   * Get file details
   */
  async getFileDetails(fileId: string): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Getting file details for ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get file details' }));
        console.error('Error getting file details:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getFileDetails response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      return data.data;
    } catch (error) {
      console.error('Error in getFileDetails:', error);
      throw error;
    }
  },

  /**
   * Create a folder
   */
  async createFolder(name: string, path: string = '/', overwrite: boolean = false): Promise<any> {
    try {
      const token = getAuthToken();
      
      console.log(`Creating folder "${name}" at path "${path}" with overwrite=${overwrite}`);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, path, overwrite })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create folder' }));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  /**
   * Upload a file to the server
   */
  async uploadFile(
    file: File, 
    parentId: string | null = null, 
    onProgress?: (progress: number) => void,
    overwrite: boolean = false
  ): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      if (parentId) {
        formData.append('parentId', parentId);
      }
      
      // Add overwrite flag
      formData.append('overwrite', overwrite ? 'true' : 'false');
      
      // Create upload request
          const xhr = new XMLHttpRequest();
      xhr.open('POST', `${normalizedApiUrl}/api/files/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.withCredentials = true;
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
      };
          
      // Return a promise that resolves when the upload is complete
      return new Promise((resolve, reject) => {
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
              const response = JSON.parse(xhr.responseText);
                
                // Handle Elysia middleware response format
              const data = handleElysiaResponse(response);
              
              if (data.success && data.data) {
                resolve(data.data);
              } else {
                reject(new Error(data.message || 'Upload failed'));
              }
              } catch (error) {
              reject(new Error('Failed to parse server response'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `HTTP error! Status: ${xhr.status}`));
              } catch (e) {
              reject(new Error(`HTTP error! Status: ${xhr.status}`));
            }
          }
        };
          
        xhr.onerror = function() {
          reject(new Error('Network error occurred during upload'));
        };
        
          xhr.send(formData);
        });
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string, fileName: string): Promise<Blob> {
    try {
      const token = getAuthToken();
      
      console.log('Downloading file:', fileName, 'ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to download file');
        console.error('Error downloading file:', errorText);
        throw new Error(errorText || `HTTP error! Status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error in downloadFile:', error);
      throw error;
    }
  },

  /**
   * Download a folder as ZIP
   */
  async downloadFolder(folderId: string, folderName: string): Promise<Blob> {
    try {
      const token = getAuthToken();
      
      console.log('Downloading folder as ZIP:', folderName, 'ID:', folderId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/download-folder/${folderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to download folder');
        console.error('Error downloading folder:', errorText);
        throw new Error(errorText || `HTTP error! Status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error in downloadFolder:', error);
      throw error;
    }
  },

  /**
   * Move file to trash
   */
  async moveToTrash(fileId: string): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Moving file to trash, ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}/trash`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to move file to trash' }));
        
        // If the file is already in trash, this is not really an error
        if (errorData.message && errorData.message.includes('already in trash')) {
          console.log('File is already in trash, not an error:', errorData);
          
          // Dispatch a refresh event to update the file list anyway
          const refreshEvent = new CustomEvent('files-refreshed', { 
            detail: { location: 'Drive' } 
          });
          window.dispatchEvent(refreshEvent);
          
          // Return the file data if available, otherwise throw a more friendly error
          if (errorData.data) {
            return errorData.data;
          } else {
            throw new Error('File is already in trash');
          }
        }
        
        console.error('Error moving file to trash:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('moveToTrash response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to move file to trash');
      }

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      // Dispatch a refresh event to update the file list
      const refreshEvent = new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      });
      window.dispatchEvent(refreshEvent);

      return data.data;
    } catch (error) {
      console.error('Error in moveToTrash:', error);
      throw error;
    }
  },

  /**
   * Restore file from trash
   */
  async restoreFromTrash(fileId: string): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Restoring file from trash, ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/restore/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to restore file from trash' }));
        
        // If the file is already in Drive, this is not really an error
        if (errorData.message && errorData.message.includes('already in Drive')) {
          console.log('File is already in Drive, not an error:', errorData);
          
          // Dispatch refresh events to update both Bin and Drive file lists
          const refreshEventBin = new CustomEvent('files-refreshed', { 
            detail: { location: 'Bin' } 
          });
          window.dispatchEvent(refreshEventBin);
          
          const refreshEventDrive = new CustomEvent('files-refreshed', { 
            detail: { location: 'Drive' } 
          });
          window.dispatchEvent(refreshEventDrive);
          
          // Return the file data if available, otherwise throw a more friendly error
          if (errorData.data) {
            return errorData.data;
          } else {
            throw new Error('File is already in Drive');
          }
        }
        
        console.error('Error restoring file from trash:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('restoreFromTrash response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to restore file from trash');
      }

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      // Dispatch refresh events to update both Bin and Drive file lists
      const refreshEventBin = new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      });
      window.dispatchEvent(refreshEventBin);
      
      const refreshEventDrive = new CustomEvent('files-refreshed', { 
        detail: { location: 'Drive' } 
      });
      window.dispatchEvent(refreshEventDrive);

      return data.data;
    } catch (error) {
      console.error('Error in restoreFromTrash:', error);
      throw error;
    }
  },

  /**
   * Delete file permanently
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const token = getAuthToken();
      
      console.log('Deleting file permanently, ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete file' }));
        console.error('Error deleting file:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      // Dispatch refresh event to update file list
      const refreshEvent = new CustomEvent('files-refreshed', { 
        detail: { location: 'Bin' } 
      });
      window.dispatchEvent(refreshEvent);

      console.log('File deleted successfully, ID:', fileId);
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  },

  /**
   * Rename file or folder
   */
  async renameFile(fileId: string, newName: string): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Renaming file, ID:', fileId, 'New name:', newName);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ newName })
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to rename file' }));
        console.error('Error renaming file:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('renameFile response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      return data.data;
    } catch (error) {
      console.error('Error in renameFile:', error);
      throw error;
    }
  },

  /**
   * Move a file to a different folder
   */
  async moveFile(fileId: string, destinationFolderId: string | null): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Moving file, ID:', fileId, 'Destination folder ID:', destinationFolderId || 'root');
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ destinationFolderId })
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to move file' }));
        console.error('Error moving file:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('moveFile response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      return data.data;
    } catch (error) {
      console.error('Error in moveFile:', error);
      throw error;
    }
  },

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string): Promise<FileItem> {
    try {
      const token = getAuthToken();
      
      console.log('Duplicating file, ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to duplicate file' }));
        console.error('Error duplicating file:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('duplicateFile response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      return data.data;
    } catch (error) {
      console.error('Error in duplicateFile:', error);
      throw error;
    }
  },
  
  /**
   * Get file preview data
   */
  async getFilePreview(fileId: string): Promise<FilePreviewDto> {
    try {
      const token = getAuthToken();
      console.log('Requesting preview for file:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/${fileId}/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Preview request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to get file preview: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Preview response data:', data);
      
      // Return the data directly since it's already in the correct format
      if (data.success && data.data) {
        return data;
      }
      
      throw new Error('Invalid preview data received from server');
    } catch (error) {
      console.error('Error getting file preview:', error);
      throw error;
    }
  },
  
  /**
   * Get a temporary URL for a file (for streaming or external access)
   */
  async getFileUrl(fileId: string): Promise<string> {
    try {
      const token = getAuthToken();
      
      console.log('Getting file URL, ID:', fileId);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/url/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get file URL' }));
        console.error('Error getting file URL:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getFileUrl response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data || !data.data.url) {
        throw new Error('Invalid response format from server: missing URL');
      }

      return data.data.url;
    } catch (error) {
      console.error('Error in getFileUrl:', error);
      throw error;
    }
  },
  
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const token = getAuthToken();
      
      console.log('Getting storage statistics');
      
      const response = await fetch(`${normalizedApiUrl}/api/files/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to get storage statistics' }));
        console.error('Error getting storage statistics:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('getStorageStats response:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!data.data) {
        throw new Error('Invalid response format from server: missing data');
      }

      return data.data;
    } catch (error) {
      console.error('Error in getStorageStats:', error);
      throw error;
    }
  },

  /**
   * Empty trash (delete all files in trash)
   */
  async emptyTrash(): Promise<void> {
    try {
      const token = getAuthToken();
      
      console.log('Emptying trash');
      
      const response = await fetch(`${normalizedApiUrl}/api/files/empty-trash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to empty trash' }));
        console.error('Error emptying trash:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      console.log('Trash emptied successfully');
    } catch (error) {
      console.error('Error in emptyTrash:', error);
      throw error;
    }
  },

  /**
   * Synchronize MinIO and database at a specific path
   */
  async syncStorage(path: string = '/', location: string = 'Drive'): Promise<any> {
    try {
      const token = getAuthToken();
      
      console.log('Syncing storage at path:', path, 'location:', location);
      
      const url = `${normalizedApiUrl}/api/files/sync?path=${encodeURIComponent(path)}&location=${location}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Get the response text first to ensure we can debug it
      const responseText = await response.text();
      console.log('Raw syncStorage response:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to sync storage';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      const data = JSON.parse(responseText);
      
      // Handle Elysia middleware response format
      const processedData = handleElysiaResponse(data);
      
      console.log('Processed syncStorage response:', processedData);
      
      return processedData;
    } catch (error) {
      console.error('Error syncing storage:', error);
      throw error;
    }
  },

  /**
   * Fix duplicated Drive folders
   */
  async fixDuplicatedDriveFolders(): Promise<any> {
    try {
      const token = getAuthToken();
      
      console.log('Fixing duplicated Drive folders');
      
      const url = `${normalizedApiUrl}/api/files/fix-duplicated-drives`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Get the response text first to ensure we can debug it
      const responseText = await response.text();
      console.log('Raw fixDuplicatedDriveFolders response:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fix duplicated Drive folders';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      const data = JSON.parse(responseText);
      
      // Handle Elysia middleware response format
      const processedData = handleElysiaResponse(data);
      
      console.log('Processed fixDuplicatedDriveFolders response:', processedData);
      
      return processedData;
    } catch (error) {
      console.error('Error fixing duplicated Drive folders:', error);
      throw error;
    }
  },

  /**
   * Repair folder structure for current user
   * This can be used after login or registration to ensure folders exist
   */
  async repairFolderStructure(): Promise<boolean> {
    try {
      console.log('Requesting folder structure repair');
      const { authGateway } = await import('./authGateway');
      return await authGateway.repairFolderStructure();
    } catch (error) {
      console.error('Error repairing folder structure:', error);
      return false;
    }
  },

  /**
   * Create initial folder structure for a new user
   * This is used right after registration to ensure folders are created
   * @param email The email of the newly registered user
   */
  async createInitialStructure(email: string): Promise<boolean> {
    try {
      console.log('Creating initial folder structure for:', email);
      
      const response = await fetch(`${normalizedApiUrl}/api/files/create-initial-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      console.log('Create initial structure response:', data);
      
      if (!response.ok) {
        console.error('Failed to create initial structure:', data.message);
        return false;
      }
      
      return data.success === true;
    } catch (error) {
      console.error('Error creating initial folder structure:', error);
      return false;
    }
  },

  async getFolderContents(folderId: string = 'root'): Promise<FolderContents> {
    try {
      const token = getAuthToken();
      const url = folderId === 'root' 
        ? `${normalizedApiUrl}/api/files?location=Drive` 
        : `${normalizedApiUrl}/api/files/folder/${folderId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get folder contents: ${response.status}`);
      }
      
      const data = await response.json();
      const processedData = handleElysiaResponse(data);
      
      // Structure the response as FolderContents
      let folderContents: FolderContents;
      
      if (processedData.id) {
        // Response is already a FolderContents object
        folderContents = processedData;
      } else {
        // Need to structure the response as FolderContents
        const files = Array.isArray(processedData) ? processedData : processedData.files || [];
        
        // Split into files and folders
        const folders = files.filter(file => file.isFolder);
        const regularFiles = files.filter(file => !file.isFolder);
        
        folderContents = {
          id: folderId,
          name: folderId === 'root' ? 'Root' : 'Folder',
          path: '/',
          files: regularFiles,
          folders: folders,
          parentId: null,
          breadcrumbs: [{
            id: 'root',
            name: 'Root',
            path: '/'
          }]
        };
      }
      
      return folderContents;
    } catch (error) {
      console.error('Error getting folder contents:', error);
      throw error;
    }
  },

  /**
   * Restore all files from trash
   */
  async restoreAllFromTrash(): Promise<void> {
    try {
      const token = getAuthToken();
      
      console.log('Restoring all files from trash');
      
      const response = await fetch(`${normalizedApiUrl}/api/files/restore-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // If response is not ok, parse the error message
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to restore all files' }));
        console.error('Error restoring all files:', errorData);
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      console.log('All files restored successfully');
    } catch (error) {
      console.error('Error in restoreAllFromTrash:', error);
      throw error;
    }
  },
};

export default fileGateway; 