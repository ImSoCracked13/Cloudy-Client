import { createStore } from 'solid-js/store';
import { FileItem, StorageStats } from '../../types/fileType';

export interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FilePreview {
  id: string;
  name: string;
  type: 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'other';
  content: string;
  url?: string;
  size: number;
}

export interface FileProperties {
  id: string;
  name: string;
  mimeType: string;
  location: string;
  size: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FileState {
  // File lists
  driveFiles: FileItem[];
  binFiles: FileItem[];
  searchResults: FileItem[];
  filteredFiles: FileItem[];
  
  // Current location and selection
  currentLocation: 'drive' | 'bin';
  selectedFile: FileItem | null;
  
  // Loading states
  filesLoading: boolean;
  uploadLoading: boolean;
  downloadLoading: boolean;
  deleteLoading: boolean;
  renameLoading: boolean;
  duplicateLoading: boolean;
  moveLoading: boolean;
  restoreLoading: boolean;
  previewLoading: boolean;
  propertiesLoading: boolean;
  searchLoading: boolean;
  filterLoading: boolean;
  emptyBinLoading: boolean;
  
  // Error states
  filesError: string | null;
  uploadError: string | null;
  downloadError: string | null;
  deleteError: string | null;
  renameError: string | null;
  duplicateError: string | null;
  moveError: string | null;
  restoreError: string | null;
  previewError: string | null;
  propertiesError: string | null;
  searchError: string | null;
  filterError: string | null;
  emptyBinError: string | null;
  
  // Upload management
  uploads: UploadItem[];
  downloadProgress: number;
  
  // Preview and properties
  preview: FilePreview | null;
  properties: FileProperties | null;
  
  // Storage stats
  storageStats: StorageStats | null;
  storageStatsLoading: boolean;
  storageStatsError: string | null;
  
  // Filter and search
  activeFilter: string[];
  lastUpdated: Date;
}

// Create the file store
const [fileState, setFileState] = createStore<FileState>({
  // File lists
  driveFiles: [],
  binFiles: [],
  searchResults: [],
  filteredFiles: [],
  
  // Current location and selection
  currentLocation: 'drive',
  selectedFile: null,
  
  // Loading states
  filesLoading: false,
  uploadLoading: false,
  downloadLoading: false,
  deleteLoading: false,
  renameLoading: false,
  duplicateLoading: false,
  moveLoading: false,
  restoreLoading: false,
  previewLoading: false,
  propertiesLoading: false,
  searchLoading: false,
  filterLoading: false,
  emptyBinLoading: false,
  
  // Error states
  filesError: null,
  uploadError: null,
  downloadError: null,
  deleteError: null,
  renameError: null,
  duplicateError: null,
  moveError: null,
  restoreError: null,
  previewError: null,
  propertiesError: null,
  searchError: null,
  filterError: null,
  emptyBinError: null,
  
  // Upload management
  uploads: [],
  downloadProgress: 0,
  
  // Preview and properties
  preview: null,
  properties: null,
  
  // Storage stats
  storageStats: null,
  storageStatsLoading: false,
  storageStatsError: null,
  
  // Filter and search
  activeFilter: [],
  lastUpdated: new Date()
});

// Helper functions to update the store
export const fileStore = {
  // State getter
  get state() {
    return fileState;
  },
  
  // File list actions
  setDriveFiles: (files: FileItem[]) => {
    setFileState('driveFiles', files);
    setFileState('lastUpdated', new Date());
  },
  
  setBinFiles: (files: FileItem[]) => {
    setFileState('binFiles', files);
    setFileState('lastUpdated', new Date());
  },
  
  setCurrentLocation: (location: 'drive' | 'bin') => {
    setFileState('currentLocation', location);
  },
  
  setSelectedFile: (file: FileItem | null) => {
    setFileState('selectedFile', file);
  },
  
  // Files loading and error
  setFilesLoading: (loading: boolean) => {
    setFileState('filesLoading', loading);
    if (loading) setFileState('filesError', null);
  },
  
  setFilesError: (error: string | null) => {
    setFileState('filesError', error);
    setFileState('filesLoading', false);
  },
  
  // Upload actions
  setUploadLoading: (loading: boolean) => {
    setFileState('uploadLoading', loading);
    if (loading) setFileState('uploadError', null);
  },
  
  setUploadError: (error: string | null) => {
    setFileState('uploadError', error);
    setFileState('uploadLoading', false);
  },
  
  setUploads: (uploads: UploadItem[]) => {
    setFileState('uploads', uploads);
  },
  
  addUpload: (upload: UploadItem) => {
    setFileState('uploads', prev => [...prev, upload]);
  },
  
  updateUpload: (file: File, updates: Partial<UploadItem>) => {
    setFileState('uploads', prev => 
      prev.map(item => item.file === file ? { ...item, ...updates } : item)
    );
  },
  
  clearCompletedUploads: () => {
    setFileState('uploads', prev => prev.filter(u => u.status !== 'completed'));
  },

  clearAllUploads: () => {
    setFileState('uploads', []);
  },
  
  // Download actions
  setDownloadLoading: (loading: boolean) => {
    setFileState('downloadLoading', loading);
    if (loading) setFileState('downloadError', null);
  },
  
  setDownloadError: (error: string | null) => {
    setFileState('downloadError', error);
    setFileState('downloadLoading', false);
  },
  
  setDownloadProgress: (progress: number) => {
    setFileState('downloadProgress', progress);
  },
  
  // Delete actions
  setDeleteLoading: (loading: boolean) => {
    setFileState('deleteLoading', loading);
    if (loading) setFileState('deleteError', null);
  },
  
  setDeleteError: (error: string | null) => {
    setFileState('deleteError', error);
    setFileState('deleteLoading', false);
  },
  
  // Rename actions
  setRenameLoading: (loading: boolean) => {
    setFileState('renameLoading', loading);
    if (loading) setFileState('renameError', null);
  },
  
  setRenameError: (error: string | null) => {
    setFileState('renameError', error);
    setFileState('renameLoading', false);
  },
  
  // Duplicate actions
  setDuplicateLoading: (loading: boolean) => {
    setFileState('duplicateLoading', loading);
    if (loading) setFileState('duplicateError', null);
  },
  
  setDuplicateError: (error: string | null) => {
    setFileState('duplicateError', error);
    setFileState('duplicateLoading', false);
  },
  
  // Move to bin actions
  setMoveLoading: (loading: boolean) => {
    setFileState('moveLoading', loading);
    if (loading) setFileState('moveError', null);
  },
  
  setMoveError: (error: string | null) => {
    setFileState('moveError', error);
    setFileState('moveLoading', false);
  },
  
  // Restore actions
  setRestoreLoading: (loading: boolean) => {
    setFileState('restoreLoading', loading);
    if (loading) setFileState('restoreError', null);
  },
  
  setRestoreError: (error: string | null) => {
    setFileState('restoreError', error);
    setFileState('restoreLoading', false);
  },
  
  // Empty bin actions
  setEmptyBinLoading: (loading: boolean) => {
    setFileState('emptyBinLoading', loading);
    if (loading) setFileState('emptyBinError', null);
  },
  
  setEmptyBinError: (error: string | null) => {
    setFileState('emptyBinError', error);
    setFileState('emptyBinLoading', false);
  },
  
  // Preview actions
  setPreviewLoading: (loading: boolean) => {
    setFileState('previewLoading', loading);
    if (loading) setFileState('previewError', null);
  },
  
  setPreviewError: (error: string | null) => {
    setFileState('previewError', error);
    setFileState('previewLoading', false);
  },
  
  setPreview: (preview: FilePreview | null) => {
    setFileState('preview', preview);
  },
  
  clearPreview: () => {
    setFileState('preview', null);
    setFileState('previewError', null);
  },
  
  // Properties actions
  setPropertiesLoading: (loading: boolean) => {
    setFileState('propertiesLoading', loading);
    if (loading) setFileState('propertiesError', null);
  },
  
  setPropertiesError: (error: string | null) => {
    setFileState('propertiesError', error);
    setFileState('propertiesLoading', false);
  },
  
  setProperties: (properties: FileProperties | null) => {
    setFileState('properties', properties);
  },
  
  // Search actions
  setSearchLoading: (loading: boolean) => {
    setFileState('searchLoading', loading);
    if (loading) setFileState('searchError', null);
  },
  
  setSearchError: (error: string | null) => {
    setFileState('searchError', error);
    setFileState('searchLoading', false);
  },
  
  setSearchResults: (results: FileItem[]) => {
    setFileState('searchResults', results);
  },
  
  clearSearch: () => {
    setFileState('searchResults', []);
    setFileState('searchError', null);
  },
  
  // Filter actions
  setFilterLoading: (loading: boolean) => {
    setFileState('filterLoading', loading);
    if (loading) setFileState('filterError', null);
  },
  
  setFilterError: (error: string | null) => {
    setFileState('filterError', error);
    setFileState('filterLoading', false);
  },
  
  setFilteredFiles: (files: FileItem[]) => {
    setFileState('filteredFiles', files);
  },
  
  setActiveFilter: (filter: string[]) => {
    setFileState('activeFilter', filter);
  },
  
  // Storage stats actions
  setStorageStatsLoading: (loading: boolean) => {
    setFileState('storageStatsLoading', loading);
    if (loading) setFileState('storageStatsError', null);
  },
  
  setStorageStatsError: (error: string | null) => {
    setFileState('storageStatsError', error);
    setFileState('storageStatsLoading', false);
  },
  
  setStorageStats: (stats: StorageStats | null) => {
    setFileState('storageStats', stats);
  },
  
  // Utility actions
  clearAllErrors: () => {
    setFileState({
      filesError: null,
      uploadError: null,
      downloadError: null,
      deleteError: null,
      renameError: null,
      duplicateError: null,
      moveError: null,
      restoreError: null,
      previewError: null,
      propertiesError: null,
      searchError: null,
      filterError: null,
      emptyBinError: null,
      storageStatsError: null,
    });
  },
  
  resetAllLoading: () => {
    setFileState({
      filesLoading: false,
      uploadLoading: false,
      downloadLoading: false,
      deleteLoading: false,
      renameLoading: false,
      duplicateLoading: false,
      moveLoading: false,
      restoreLoading: false,
      previewLoading: false,
      propertiesLoading: false,
      searchLoading: false,
      filterLoading: false,
      emptyBinLoading: false,
      storageStatsLoading: false,
    });
  }
};

export default fileStore;