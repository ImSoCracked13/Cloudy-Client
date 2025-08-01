import { createResource, createRoot } from 'solid-js';
import { FileItem, FilePreviewDto, StorageStats} from '../types/fileType';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const IS_PRODUCTION = import.meta.env.VITE_IS_PRODUCTION;

const BASE_API_PATH = IS_PRODUCTION ? '/api' : `${API_URL}/api`;

/**
 * Helper to get the auth token
 */
function getAuthToken(): string | null {
  const localToken = localStorage.getItem('authToken');
  const sessionToken = sessionStorage.getItem('authToken');
  const token = localToken || sessionToken;
  return token;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Resource fetchers
const fetchRefreshFile = async (path: string = '/', location: string = 'Drive') => {
  const token = getAuthToken();
  if (!token) return [];

  const basePath = path === '/' ? '' : path;
  const url = `${BASE_API_PATH}/files/path/${encodeURIComponent(basePath)}?location=${location}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
};

const fetchUpload = async (params: { file: File, parentId?: string | null, onProgress?: (progress: number) => void}) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token found');

  const formData = new FormData();
  formData.append('file', params.file);

  const response = await fetch(`${BASE_API_PATH}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: formData
  });
  const result = await handleResponse(response);
  return result;
};

const fetchPreview = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}/preview`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  const previewData = data.data || data;
  
  return previewData;
};

const fetchDownload = async (params: { fileId: string, fileName: string }) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${params.fileId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  const blob = await response.blob();
  Object.defineProperty(blob, 'name', {
    value: params.fileName,
    writable: false
  });
  
  return blob;
};

const fetchRename = async (params: { fileId: string, newName: string }) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${params.fileId}/rename`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
    body: JSON.stringify({ newName: params.newName })
  });

  const data = await handleResponse(response);
  return data.data;
};

const fetchDuplicate = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return data.data;
};

const fetchMoveToBin = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}/bin`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return data.data;
};

const fetchRestore = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}/restore`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return data.data;
};

const fetchDelete = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}?permanent=true`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  return response.ok;
};

const fetchEmptyBin = async () => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/empty-bin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  return response.ok;
};

const fetchFileProperties = async (fileId: string) => {
  const token = getAuthToken();
  const response = await fetch(`${BASE_API_PATH}/files/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return data.data;
};

const fetchFilesList = async (params: { folderId?: string | null, isBin?: boolean }) => {
  const token = getAuthToken();
  const url = params.folderId 
    ? `${BASE_API_PATH}/files?parentId=${params.folderId}&isBin=${params.isBin || false}`
    : `${BASE_API_PATH}/files?isBin=${params.isBin || false}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
};

const fetchStorageStats = async () => {
  const token = getAuthToken();
  if (!token) {
    console.log('No auth token found for storage stats');
    return null;
  }
  
  console.log('Fetching storage stats');
  const response = await fetch(`${BASE_API_PATH}/files/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });

  const data = await handleResponse(response);
  // Return with computed percentage for smoother updates
  const stats = data.data;
  return {...stats};
};

// Create root for resources
const fileRoot = createRoot(() => {
  const [refreshFileResource, { refetch: refetchRefreshFile }] = createResource(false, () => fetchRefreshFile());
  const [uploadResource, { refetch: refetchUpload }] = createResource(() => null);
  const [previewResource, { refetch: refetchPreview }] = createResource<FilePreviewDto>(() => null);
  const [downloadResource, { refetch: refetchDownload }] = createResource<Blob>(() => null);
  const [renameResource, { refetch: refetchRename }] = createResource<FileItem>(() => null);
  const [duplicateResource, { refetch: refetchDuplicate }] = createResource<FileItem>(() => null);
  const [moveToBinResource, { refetch: refetchMoveToBin }] = createResource<FileItem>(() => null);
  const [restoreResource, { refetch: refetchRestore }] = createResource<FileItem>(() => null);
  const [deleteResource, { refetch: refetchDelete }] = createResource<boolean>(() => null);
  const [emptyBinResource, { refetch: refetchEmptyBin }] = createResource<boolean>(() => null);
  const [filePropertiesResource, { refetch: refetchFileProperties }] = createResource<FileItem>(() => null);
  const [filesListResource, { refetch: refetchFilesList }] = createResource<FileItem[]>(() => null);
  const [storageStatsResource, { refetch: refetchStorageStats }] = createResource(false, fetchStorageStats);

  return {
    refreshFileResource,
    refetchRefreshFile,
    uploadResource,
    refetchUpload,
    previewResource,
    refetchPreview,
    downloadResource,
    refetchDownload,
    renameResource,
    refetchRename,
    duplicateResource,
    refetchDuplicate,
    moveToBinResource,
    refetchMoveToBin,
    restoreResource,
    refetchRestore,
    deleteResource,
    refetchDelete,
    emptyBinResource,
    refetchEmptyBin,
    filePropertiesResource,
    refetchFileProperties,
    filesListResource,
    refetchFilesList,
    storageStatsResource,
    refetchStorageStats
  };
});

/**
 * Gateway layer for file operations API calls
 */
export const fileGateway = {
  // Resource getters
  getRefreshFileResource: () => fileRoot.refreshFileResource,
  getUploadResource: () => fileRoot.uploadResource,
  getPreviewResource: () => fileRoot.previewResource,
  getDownloadResource: () => fileRoot.downloadResource,
  getRenameResource: () => fileRoot.renameResource,
  getDuplicateResource: () => fileRoot.duplicateResource,
  getMoveToBinResource: () => fileRoot.moveToBinResource,
  getRestoreResource: () => fileRoot.restoreResource,
  getDeleteResource: () => fileRoot.deleteResource,
  getEmptyBinResource: () => fileRoot.emptyBinResource,
  getFilePropertiesResource: () => fileRoot.filePropertiesResource,
  getFilesListResource: () => fileRoot.filesListResource,
  getStorageStatsResource: () => fileRoot.storageStatsResource,

  /**
   * Refresh function with global cooldown that only refresh once per operation
   */
  async refreshFileList(path: string = '/', location: string = 'Drive'): Promise<FileItem[]> {
    try {
      const data = await fetchRefreshFile(path, location);
      await fileRoot.refetchRefreshFile();
      return data;
    } catch (error) {
      console.error('Error in refreshFileList:', error);
      return [];
    }
  },

  /**
   * Upload a file to the server
   */
  async uploadFile(
    file: File, 
    parentId: string | null = null, 
    onProgress?: (progress: number) => void,
  ): Promise<FileItem> {
    try {
      console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
      const result = await fetchUpload({ file, parentId, onProgress });
      await fileRoot.refetchUpload();
      return result;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  },

  /**
   * Get file preview data
   */
  async previewFile(fileId: string): Promise<FilePreviewDto> {
    try {
      console.log('Requesting preview for file:', fileId);
      const data = await fetchPreview(fileId);
      await fileRoot.refetchPreview();
      return data;
    } catch (error) {
      console.error('Error getting file preview:', error);
      throw error;
    }
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string, fileName: string): Promise<Blob> {
    try {
      console.log('Downloading file:', fileName, 'ID:', fileId);
      const blob = await fetchDownload({ fileId, fileName });
      await fileRoot.refetchDownload();
      return blob;
    } catch (error) {
      console.error('Error in downloadFile:', error);
      throw error;
    }
  },

  /**
   * Rename file or folder
   */
  async renameFile(fileId: string, newName: string): Promise<FileItem> {
    try {
      console.log('Renaming file, ID:', fileId, 'New name:', newName);
      const result = await fetchRename({ fileId, newName });
      Promise.all([
        fileRoot.refetchRename(),
        fileRoot.refetchRefreshFile(), // Refresh the file after renaming
        fileRoot.refetchFileProperties() // Refresh file properties cache
      ]);
      return result;
    } catch (error) {
      console.error('Error in renameFile:', error);
      throw error;
    }
  },

  /**
   * Duplicate a file
   */
  async duplicateFile(fileId: string): Promise<FileItem> {
    try {
      console.log('Duplicating file, ID:', fileId);
      const result = await fetchDuplicate(fileId);
      Promise.all([
        fileRoot.refetchDuplicate(),
        fileRoot.refetchRefreshFile(), // Refresh the file after duplication
      ]);
      return result;
    } catch (error) {
      console.error('Error in duplicateFile:', error);
      throw error;
    }
  },

  /**
   * Move file to bin
   */
  async moveToBin(fileId: string): Promise<FileItem> {
    try {
      console.log('Moving file to trash, ID:', fileId);
      const result = await fetchMoveToBin(fileId);
      await Promise.all([
        fileRoot.refetchMoveToBin(),
        fileRoot.refetchRefreshFile(), // Refresh the file after moving to bin
        fileRoot.refetchFileProperties() // Refresh file properties cache
      ]);
      
      return result;
    } catch (error) {
      console.error('Error in moveToBin:', error);
      throw error;
    }
  },

  /**
   * Restore file from trash
   */
  async restoreFromBin(fileId: string): Promise<FileItem> {
    try {
      console.log('Restoring file from trash, ID:', fileId);
      const result = await fetchRestore(fileId);
      await Promise.all([
        fileRoot.refetchRestore(),
        fileRoot.refetchRefreshFile(), // Refresh the file after restoration
        fileRoot.refetchFileProperties() // Refresh file properties cache
      ]);
      
      return result;
    } catch (error) {
      console.error('Error in restoreFromBin:', error);
      throw error;
    }
  },

  /**
   * Delete file permanently
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log('Deleting file permanently, ID:', fileId);
      await fetchDelete(fileId);
      await Promise.all([
        fileRoot.refetchDelete(),
        fileRoot.refetchRefreshFile() // Refresh the file list after deletion
      ]);
      
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  },

  /**
   * Empty bin (delete all files in bin)
   */
  async emptyBin(): Promise<void> {
    try {
      console.log('Emptying bin');
      await fetchEmptyBin();
      await Promise.all([
        fileRoot.refetchEmptyBin(),
        fileRoot.refetchRefreshFile() // Refresh the file list after emptying bin
      ]);
    } catch (error) {
      console.error('Error in emptyBin:', error);
      throw error;
    }
  },

  /**
   * Get file details
   */
  async getFileProperties(fileId: string): Promise<FileItem> {
    try {
      console.log('Fetching file properties for ID:', fileId);
      const result = await fetchFileProperties(fileId);
      await fileRoot.refetchFileProperties();
      return result;
    } catch (error) {
      console.error('Error in getFileProperties:', error);
      throw error;
    }
  },

  /**
   * Get files by location for listing (Drive or Bin)
   */
  async getFilesList(folderId: string | null = null, isBin: boolean = false): Promise<FileItem[]> {
    try {
      const result = await fetchFilesList({ folderId, isBin });
      await fileRoot.refetchFilesList();
      return result;
    } catch (error) {
      console.error('Error in getFiles:', error);
      return [];
    }
  },
  
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const result = await fetchStorageStats();
      await fileRoot.refetchStorageStats();
      return result;
    } catch (error) {
      console.error('Error in getStorageStats:', error);
      throw error;
    }
  },
};

export default fileGateway;
export type { FileItem, FilePreviewDto, StorageStats };