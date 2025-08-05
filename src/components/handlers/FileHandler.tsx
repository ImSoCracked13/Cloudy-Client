import { Component, createContext, useContext, createSignal, createEffect, Show } from 'solid-js';

import { useUpload } from '../hooks/files/drive/useUpload';
import { useDownload } from '../hooks/files/drive/useDownload';
import { useRename } from '../hooks/files/drive/useRename';
import { useDuplicate } from '../hooks/files/drive/useDuplicate';
import { useMoveToBin } from '../hooks/files/drive/useMoveToBin';
import { usePreview } from '../hooks/files/drive/usePreview';
import { useFilter } from '../hooks/files/drive/useFilter';
import { useDragDrop } from '../hooks/files/drive/useDragDrop';

import { useRestore } from '../hooks/files/bin/useRestore';
import { useDeleteForever } from '../hooks/files/bin/useDeleteForever';
import { useEmptyBin } from '../hooks/files/bin/useEmptyBin';

import { useProperties } from '../hooks/files/joints/useProperties';
import { useStorageStats } from '../hooks/files/joints/useStorageStats';
import { useFilesList } from '../hooks/files/joints/useFilesList';

// Export hooks directly for use in components
export {
  useUpload, useDownload, useRename, useDuplicate,
  useMoveToBin, usePreview, useFilter, useDragDrop, useRestore, useDeleteForever,
  useEmptyBin, useProperties, useStorageStats, useFilesList
};

interface FileHandlerProps {
  children?: any;
}

// Define FileItem interface
export interface FileItem {
  id: string;
  name: string;
  path?: string;
  size?: number;
  type?: string;
  mimeType?: string;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  isBin?: boolean;
  [key: string]: any; // Allow other properties
}

// Define StorageStats interface
export interface StorageStats {
  used: number;
  total: number;
  percentage: number;
  files: number;
}

// Define FilePreview interface
export interface FilePreview {
  url?: string;
  type?: 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'other';
  name: string;
  mimeType?: string;
}

// Define FileProperties interface
export interface FileProperties extends FileItem {
  isPublic?: boolean;
  sharedWith?: string[];
}

// Define FileContextValue interface
export interface FileContextValue {
  // File operations
  selectedFile: () => FileItem | null;
  loading: () => boolean;
  error: () => string | null;
  
  // File listing
  files: () => FileItem[];
  lastUpdated: () => Date;
  fetchFiles: (isBin: boolean, forceRefresh?: boolean) => Promise<void>;

  fileExists: (fileName: string) => boolean;
  refreshFiles: (isBin: boolean) => Promise<void>;
  
  // File actions
  uploadFiles: (files: File[]) => Promise<FileItem[]>;
  downloadFile: (fileId: string, fileName: string) => Promise<boolean>;
  renameFile: (fileId: string, oldName: string, newName: string) => Promise<FileItem | null>;
  duplicateFile: (fileId: string) => Promise<FileItem | null>;
  moveToBin: (fileId: string) => Promise<boolean>;
  restore: (fileId: string) => Promise<boolean>;
  deleteForever: (fileId: string, fileName: string) => Promise<boolean>;
  emptyBin: () => Promise<boolean>;
  
  // File information
  loadProperties: (fileId: string) => Promise<FileProperties | null>;
  loadStats: (forceRefresh?: boolean) => Promise<StorageStats>;
  
  // Preview
  getPreview: (fileId: string) => Promise<FilePreview | null>;
  clearPreview: () => void;
}

// Create context for file handling
const FileContext = createContext<FileContextValue>();

function useFile() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFile must be used within a FileHandler');
  }
  return context;
}

// Export the primary hook with the desired name
export { useFile as useFileHandler};

export const FileHandler: Component<FileHandlerProps> = (props) => {
  const { selectedFile, loading, error, loadProperties } = useProperties();
  const { uploadFiles } = useUpload();
  const { downloadFile } = useDownload();
  const { renameFile } = useRename();
  const { duplicateFile } = useDuplicate();
  const { moveToBin } = useMoveToBin();
  const { restore } = useRestore();
  const { deleteForever } = useDeleteForever();
  const { emptyBin } = useEmptyBin();
  const { loadStats } = useStorageStats();
  const { getPreview, clearPreview } = usePreview();
  
  // Add files info hook
  const {
    files,
    lastUpdated,
    fetchFiles,

    fileExists,
    refreshFiles,
  } = useFilesList();
  
  // Initialize loading state
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [initError, setInitError] = createSignal<string | null>(null);
  
  // Load initial data
  createEffect(async () => {
    try {
      // Only load initial properties if needed, file fetching is handled by FileList
      if (selectedFile()) {
        await loadProperties(selectedFile()!.id);
      }
      
      setInitError(null);
    } catch (error) {
      console.error('Error loading initial file data:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize file system');
    } finally {
      setIsInitializing(false);
    }
  });

  const value: FileContextValue = {
    selectedFile,
    loading,
    error,
    // Add file listing functions
    files,
    lastUpdated,
    fetchFiles,

    fileExists,
    refreshFiles,
    // Existing functions
    uploadFiles,
    downloadFile,
    renameFile,
    duplicateFile,
    moveToBin,
    restore,
    deleteForever,
    emptyBin,
    loadProperties,
    loadStats,
    getPreview,
    clearPreview
  };

  return (
    <FileContext.Provider value={value}>
        <Show
          when={!initError()}
          fallback={
            <div class="flex flex-col items-center justify-center h-screen gap-4">
              <div class="text-error text-lg">{initError()}</div>
              <button
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          }
        >
          {props.children}
        </Show>
    </FileContext.Provider>
  );
};