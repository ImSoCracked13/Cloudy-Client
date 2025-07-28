import { onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

// Define public routes where file fetching should be disabled
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/about',
  '/verification-pending',
  '/verify-email',
  '/error'
];

// Check if current path is a public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname) || 
          pathname.startsWith('/verify/') || 
          pathname.startsWith('/error');
};

// Cache and request management
let lastDriveFetchTime = 0;
let lastBinFetchTime = 0;
let pendingDriveRequest: Promise<void> | null = null;
let pendingBinRequest: Promise<void> | null = null;
let eventListenersSetup = false;

const CACHE_DURATION = 10 * 1000; // 10 seconds cache for files

export function useFilesList() {
  const location = useLocation();

  // Get files based on current location
  const files = () => {
    return fileStore.state.currentLocation === 'bin' ? fileStore.state.binFiles : fileStore.state.driveFiles;
  };

  // Fetch files from server with deduplication and caching
  const fetchFiles = async (isBin: boolean = false, forceRefresh: boolean = false) => {
    // Skip file fetching if on public pages
    if (isPublicRoute(location.pathname)) {
      console.log('Skipping file fetch on public route:', location.pathname);
      return;
    }

    const now = Date.now();
    const lastFetchTime = isBin ? lastBinFetchTime : lastDriveFetchTime;
    const pendingRequest = isBin ? pendingBinRequest : pendingDriveRequest;
    const fileType = isBin ? 'bin' : 'drive';
    const currentFiles = isBin ? fileStore.state.binFiles : fileStore.state.driveFiles;
    
    // Check if we have fresh data and the current location matches what we're asking for
    const hasFreshData = currentFiles.length > 0 && (now - lastFetchTime) < CACHE_DURATION;
    const locationMatches = fileStore.state.currentLocation === (isBin ? 'bin' : 'drive');
    
    if (!forceRefresh && hasFreshData && locationMatches) {
      return;
    }

    // If there's already a pending request for this type, wait for it
    if (pendingRequest) {
      return pendingRequest;
    }

    // Start new request
    fileStore.setFilesLoading(true);
    fileStore.setFilesError(null);
    fileStore.setCurrentLocation(isBin ? 'bin' : 'drive');

    const requestPromise = (async () => {
      try {
        const response = await fileService.getFilesList(null, isBin);
        if (response && Array.isArray(response)) {
          if (isBin) {
            fileStore.setBinFiles(response);
            lastBinFetchTime = now;
          } else {
            fileStore.setDriveFiles(response);
            lastDriveFetchTime = now;
          }
        } else {
          fileStore.setFilesError('Failed to fetch files');
        }
      } catch (err) {
        console.error(`Error fetching ${fileType} files:`, err);
        fileStore.setFilesError('Failed to fetch files');
      } finally {
        fileStore.setFilesLoading(false);
        if (isBin) {
          pendingBinRequest = null;
        } else {
          pendingDriveRequest = null;
        }
      }
    })();

    if (isBin) {
      pendingBinRequest = requestPromise;
    } else {
      pendingDriveRequest = requestPromise;
    }

    return requestPromise;
  };

  // Listen for file operations that require refresh
  const handleRefreshEvent = (event: CustomEvent) => {
    const { location } = event.detail || {};
    // Refresh the appropriate file list based on the location in the event detail
    if (location === 'Drive') {
      fetchFiles(false, true); // Force refresh for Drive files
    } else if (location === 'Bin') {
      fetchFiles(true, true); // Force refresh for Bin files
    }
  };

  // Set up event listeners only once (singleton pattern)
  const handleFileUploaded = () => fetchFiles(false, true); // Force refresh on upload
  
  onMount(() => {
    // Only set up event listeners if not already done
    if (!eventListenersSetup) {
      window.addEventListener('files-refreshed', handleRefreshEvent as EventListener);
      window.addEventListener('file-uploaded', handleFileUploaded);
      window.addEventListener('file-deleted', handleRefreshEvent as EventListener);
      window.addEventListener('file-renamed', handleRefreshEvent as EventListener);
      window.addEventListener('file-duplicated', handleRefreshEvent as EventListener);
      eventListenersSetup = true;
    }
  });

  // Get files by type
  const getFilesByType = (type: string | null) => {
    if (!type) return files();
    return files().filter(file => file.type === type);
  };

  // Get files by search term
  const getFilesBySearch = (searchTerm: string) => {
    if (!searchTerm) return files();
    const term = searchTerm.toLowerCase();
    return files().filter(file => 
      file.name.toLowerCase().includes(term) ||
      (file.type && file.type.toLowerCase().includes(term))
    );
  };

  // Sort files by different criteria
  const getSortedFiles = (
    fileList: FileItem[],
    sortBy: 'name' | 'size' | 'date' = 'name',
    ascending: boolean = true
  ) => {
    return [...fileList].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
          break;
      }
      return ascending ? comparison : -comparison;
    });
  };

  // Get total size of files
  const getTotalSize = () => {
    return files().reduce((total, file) => total + (file.size || 0), 0);
  };

  // Get count by file type
  const getCountByType = () => {
    return files().reduce((acc, file) => {
      const type = file.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  // Check if file exists
  const fileExists = (fileName: string) => {
    return files().some(file => file.name === fileName);
  };

  // Get unique file types
  const getUniqueTypes = () => {
    return Array.from(new Set(files().map(file => file.type || 'other')));
  };

  // Refresh files list
  const refreshFiles = async (isBin: boolean = false) => {
    await fetchFiles(isBin, true); // Force refresh when explicitly requested
  };

  // Update local file list after operations
  const updateLocalFiles = (updatedFiles: FileItem[], isBin: boolean = false) => {
    if (isBin) {
      fileStore.setBinFiles(updatedFiles);
    } else {
      fileStore.setDriveFiles(updatedFiles);
    }
  };

  return {
    files,
    loading: () => fileStore.state.filesLoading,
    error: () => fileStore.state.filesError,
    lastUpdated: () => fileStore.state.lastUpdated,
    fetchFiles,
    getFilesByType,
    getFilesBySearch,
    getSortedFiles,
    getTotalSize,
    getCountByType,
    fileExists,
    getUniqueTypes,
    refreshFiles,
    updateLocalFiles,
    getDriveFiles: () => fileStore.state.driveFiles,
    getBinFiles: () => fileStore.state.binFiles,
    getCurrentLocation: () => fileStore.state.currentLocation
  };
} 