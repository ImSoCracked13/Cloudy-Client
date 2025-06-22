import { createSignal } from "solid-js";
import type { FileItem, FolderContents, FileUploadProgress } from '../types/fileType';

// Create simple signals as a replacement for the store
const [currentFolder, setCurrentFolder] = createSignal<string>('root');
const [folderContents, setFolderContents] = createSignal<FolderContents | null>(null);
const [folderPath, setFolderPath] = createSignal<string[]>([]);
const [selectedFiles, setSelectedFiles] = createSignal<FileItem[]>([]);
const [isLoading, setLoading] = createSignal<boolean>(false);
const [error, setError] = createSignal<string | null>(null);
const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');
const [sortBy, setSortBy] = createSignal<'name' | 'size' | 'modified'>('name');
const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc'>('asc');
const [searchQuery, setSearchQuery] = createSignal<string>('');
const [uploadProgress, setUploadProgress] = createSignal<Record<string, FileUploadProgress>>({});
const [recentFiles, setRecentFiles] = createSignal<FileItem[]>([]);

// Create a mock store object that provides state access
export const fileStore = {
  get state() {
    return {
      currentFolder: currentFolder(),
      folderContents: folderContents(),
      folderPath: folderPath(),
      selectedFiles: selectedFiles(),
      isLoading: isLoading(),
      error: error(),
      viewMode: viewMode(),
      sortBy: sortBy(),
      sortDirection: sortDirection(),
      searchQuery: searchQuery(),
      uploadProgress: uploadProgress(),
      recentFiles: recentFiles()
    };
  }
};

// Create mock actions to update the state
export const fileActions = {
  setCurrentFolder: (folderId: string, path: string[] = []) => {
    setCurrentFolder(folderId);
    setFolderPath(path);
  },
  setFolderContents: (contents: FolderContents) => setFolderContents(contents),
  setSelectedFiles: (files: FileItem[]) => setSelectedFiles(files),
  toggleFileSelection: (file: FileItem) => {
    const current = selectedFiles();
    const exists = current.find(f => f.id === file.id);
    
    if (exists) {
      setSelectedFiles(current.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...current, file]);
    }
  },
  clearSelection: () => setSelectedFiles([]),
  setLoading: (loading: boolean) => setLoading(loading),
  setError: (msg: string | null) => setError(msg),
  setViewMode: (mode: 'grid' | 'list') => setViewMode(mode),
  setSorting: (by: 'name' | 'size' | 'modified', direction: 'asc' | 'desc') => {
    setSortBy(by);
    setSortDirection(direction);
  },
  setSearchQuery: (query: string) => setSearchQuery(query),
  updateUploadProgress: (fileId: string, progress: number) => {
    const current = uploadProgress();
    
    if (current[fileId]) {
      const updated = { ...current };
      updated[fileId] = { ...updated[fileId], progress };
      setUploadProgress(updated);
    }
  },
  clearUploadProgress: (fileId: string) => {
    const current = uploadProgress();
    const updated = { ...current };
    delete updated[fileId];
    setUploadProgress(updated);
  },
  addRecentFile: (file: FileItem) => {
    const current = recentFiles();
    // Remove if already exists
    const filtered = current.filter(f => f.id !== file.id);
    // Add to the beginning
    setRecentFiles([file, ...filtered].slice(0, 10));
  }
}; 