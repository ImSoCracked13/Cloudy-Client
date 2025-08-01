import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useStorageStats } from '../../../hooks/files/joints/useStorageStats';
import Bar from '../../../widgets/Bar';
import toastService from '../../../common/Notification';

interface StorageBarProps {
  onStorageClick?: () => void;
  showDetails?: boolean;
}

const StorageBar: Component<StorageBarProps> = (props) => {
  const storageStats = useStorageStats();
  const [usedStorage, setUsedStorage] = createSignal(0);
  const [totalStorage, setTotalStorage] = createSignal(0);
  const [usagePercentage, setUsagePercentage] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);
  const [hasError, setHasError] = createSignal(false);

  
  // Format storage size
  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Load storage stats
  const loadStorageStats = async () => {
    setIsLoading(true);
    setHasError(false);
    toastService.info('Storage stats loaded');
    try {
      const stats = await storageStats.loadStats(false);
      if (stats) {
        setUsedStorage(stats.used);
        setTotalStorage(stats.total);
        setUsagePercentage((stats.used / stats.total) * 100);
      } else {
        setHasError(true);
      }
    } catch (error) {
      toastService.error('Failed to load storage stats');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Event handler specifically for storage-changing operations
  const handleStorageChange = () => {
    loadStorageStatsForced();
  };

  // Load storage stats with forced refresh
  const loadStorageStatsForced = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const stats = await storageStats.loadStats(true); // Force refresh
      if (stats) {
        setUsedStorage(stats.used);
        setTotalStorage(stats.total);
        setUsagePercentage((stats.used / stats.total) * 100);
      } else {
        setHasError(true);
      }
    } catch (error) {
      toastService.error('Failed to load storage stats');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up event listeners
  onMount(() => {
    window.addEventListener('storage-changed', handleStorageChange);
    
    // Initial load
    loadStorageStats();
  });

  // Clean up event listeners
  onCleanup(() => {
    window.removeEventListener('storage-changed', handleStorageChange);
  });
  
  return (
    <div
      class="bg-background rounded-lg border border-background-light p-4 cursor-pointer hover:border-primary transition-colors duration-200"
      onClick={() => props.onStorageClick?.()}
    >
      <Show
        when={!isLoading()}
        fallback={
          <div class="flex items-center justify-center h-10">
            <div class="text-text-muted text-sm">Loading storage information...</div>
          </div>
        }
      >
        <Show
          when={!hasError()}
          fallback={
            <div class="flex items-center justify-center h-10">
              <div class="text-danger text-sm">Failed to load storage information</div>
            </div>
          }
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium">Storage</h3>
            <span class="text-xs text-text-muted">
              {formatStorageSize(usedStorage())} of {formatStorageSize(totalStorage())}
            </span>
          </div>
          
          <Bar
            progress={usagePercentage()}
            color="primary"
            size="md"
            animate={true}
            rounded={true}
          />
          
          <Show when={props.showDetails}>
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center">
                <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span>Files: {formatStorageSize(usedStorage() * 0.8)}</span>
              </div>
              <div class="flex items-center">
                <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span>Free: {formatStorageSize(totalStorage() - usedStorage())}</span>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
};

export default StorageBar; 