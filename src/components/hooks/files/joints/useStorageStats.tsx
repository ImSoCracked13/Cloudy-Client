import { useLocation } from '@solidjs/router';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { StorageStats } from '../../../../types/fileType';

// Define public routes where storage stats checking should be disabled
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

// Singleton state for storage stats to prevent duplicate calls
let lastFetchTime = 0;
let pendingRequest: Promise<StorageStats | null> | null = null;

const CACHE_DURATION = 5 * 1000; // 5 seconds cache

/**
 * Hook for managing storage statistics with singleton pattern
 */
export function useStorageStats() {
  const location = useLocation();

  const loadStats = async (forceRefresh = false): Promise<StorageStats | null> => {
    // Skip storage stats loading if on public pages
    if (isPublicRoute(location.pathname)) {
      console.log('Skipping storage stats check on public route:', location.pathname);
      fileStore.setStorageStats(null);
      fileStore.setStorageStatsLoading(false);
      fileStore.setStorageStatsError(null);
      return null;
    }

    // Check if have fresh data
    const now = Date.now();
    const hasFreshData = fileStore.state.storageStats && (now - lastFetchTime) < CACHE_DURATION;
    
    if (!forceRefresh && hasFreshData) {
      return fileStore.state.storageStats;
    }

    // If there's already a pending request, wait a moment
    if (pendingRequest) {
      return pendingRequest;
    }

    // Start new request
    fileStore.setStorageStatsLoading(true);
    fileStore.setStorageStatsError(null);

    pendingRequest = (async () => {
      try {
        const storageStats = await fileService.getStorageStats(forceRefresh);
        if (!storageStats) {
          throw new Error('Failed to load storage stats - no data received');
        }
        
        fileStore.setStorageStats(storageStats);
        lastFetchTime = now;
        return storageStats;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load storage stats';
        fileStore.setStorageStatsError(errorMessage);
        console.log('Storage stats loading failed:', error);
        return null;
      } finally {
        fileStore.setStorageStatsLoading(false);
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  };

  return {
    stats: () => fileStore.state.storageStats,
    loading: () => fileStore.state.storageStatsLoading,
    error: () => fileStore.state.storageStatsError,
    loadStats
  };
}
