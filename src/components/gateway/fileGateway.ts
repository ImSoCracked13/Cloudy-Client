import { FileItem, FilePreviewDto, StorageStats } from '../types/file';

// Get API URL from window.env or import.meta.env
const API_URL = (window as any).env?.VITE_API_URL || 
                import.meta.env.VITE_API_URL || 
                'http://localhost:3000';

console.log('File Gateway initialized with API URL:', API_URL);

/**
 * Gateway layer for file operations API calls
 */
export const fileGateway = {
  /**
   * Get files by path and location
   */
  async getFilesByPath(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    const token = localStorage.getItem('authToken');
    console.log('Auth token present:', !!token);
    console.log('Auth token length:', token ? token.length : 0);
    console.log('Auth token first 10 chars:', token ? token.substring(0, 10) + '...' : 'none');
    
    if (!token) throw new Error('Not authenticated');

    const encodedPath = encodeURIComponent(path);
    const url = `${API_URL}/api/files/path/${encodedPath}?location=${location}`;
    console.log('Requesting files from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('getFilesByPath response:', { 
      status: response.status, 
      success: data.success, 
      message: data.message,
      dataLength: data.data ? data.data.length : 0
    });

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch files');
    }

    return data.success && data.data ? data.data : [];
  },

  /**
   * Get files by location (Drive or Trash)
   */
  async getFiles(folderId: string | null = null, isTrashed: boolean = false): Promise<FileItem[]> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const url = folderId 
      ? `${API_URL}/api/files?parentId=${folderId}&isTrashed=${isTrashed}`
      : `${API_URL}/api/files?isTrashed=${isTrashed}`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch files');
    }

    return data.success && data.data ? data.data : [];
  },

  /**
   * Search files by query
   */
  async searchFiles(query: string, isTrashed: boolean = false): Promise<FileItem[]> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/search?q=${encodeURIComponent(query)}&isTrashed=${isTrashed}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to search files');
    }

    return data.success && data.data ? data.data : [];
  },

  /**
   * Get file details
   */
  async getFileDetails(fileId: string): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get file details');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Create a new folder
   */
  async createFolder(name: string, path: string = '/'): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, path })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create folder');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Upload a file with progress tracking
   */
  async uploadFile(
    file: File, 
    path: string = '/',
    onProgress?: (progress: number) => void,
    overwriteIfExists: boolean = false
  ): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    formData.append('overwriteIfExists', String(overwriteIfExists));
    
    // Create metadata
    const metadata = {
      name: file.name,
      type: file.type.split('/')[0] || 'unknown',
      mime_type: file.type,
      size: file.size,
      isPublic: false
    };
    
    formData.append('metadata', JSON.stringify(metadata));

    // Create XHR request to track progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${API_URL}/api/files/upload`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };
      
      xhr.send(formData);
    });
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string, fileName: string): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return await response.blob();
  },

  /**
   * Download a folder as ZIP
   */
  async downloadFolder(folderId: string, folderName: string): Promise<Blob> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/download-folder/${folderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download folder');
    }

    return await response.blob();
  },

  /**
   * Move a file to trash
   */
  async moveToTrash(fileId: string): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}/trash`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to move file to trash');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Restore a file from trash
   */
  async restoreFromTrash(fileId: string): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/restore/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to restore file');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Permanently delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}?permanent=true`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete file');
    }
  },

  /**
   * Rename a file
   */
  async renameFile(fileId: string, newName: string): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newName })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to rename file');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Move a file to another folder
   */
  async moveFile(fileId: string, destinationFolderId: string | null): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ destinationFolderId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to move file');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string): Promise<FileItem> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/${fileId}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to duplicate file');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },
  
  /**
   * Get file preview
   */
  async getFilePreview(fileId: string): Promise<FilePreviewDto> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/preview/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get file preview');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },
  
  /**
   * Get file URL for direct access
   */
  async getFileUrl(fileId: string): Promise<string> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/url/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get file URL');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data.url || '';
  },
  
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/storage-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get storage statistics');
    }

    if (!data.success || !data.data) {
      throw new Error('Invalid response format from server');
    }

    return data.data;
  },

  /**
   * Empty the trash bin
   */
  async emptyTrash(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/api/files/empty-trash`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to empty trash');
    }
  }
}; 