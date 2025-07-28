import { createSignal, onMount, Show } from 'solid-js';
import { useFileHandler } from '../../handlers/FileHandler';
import { StorageStats } from '../../../types/fileType';
import StorageBar from '../../blocks/files/joints/StorageBar';

export default function StorageManager() {
  const fileHandler = useFileHandler();
  
  // State for storage stats
  const [storageStats, setStorageStats] = createSignal<StorageStats>({
    used: 0,
    total: 0,
    percentage: 0,
    files: 0
  });
  
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  
  onMount(() => {
    loadStorageStats();
  });
  
  // Load storage statistics
  const loadStorageStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await fileHandler.loadStats(false);
      if (!stats) {
        throw new Error('Failed to load storage statistics');
      }
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format size in GB
  const formatGigabytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };
  
  return (
    <div class="space-y-4">
      {/* Storage bar */}
      <StorageBar showDetails={true} />
      
      {/* Error state */}
      <Show when={error()}>
        <div class="flex flex-col items-center justify-center gap-4 p-8">
          <div class="text-error text-lg">{error()}</div>
          <button
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            onClick={() => loadStorageStats()}
          >
            Retry
          </button>
        </div>
      </Show>
      
      {/* Storage statistics */}
      <div class="bg-background-darker rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-6 text-text">Storage Statistics</h2>
        <Show 
          when={!isLoading()} 
          fallback={
            <div class="flex items-center justify-center h-64">
              <div class="text-text-muted">Loading storage statistics...</div>
            </div>
          }
        >
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-6 bg-background rounded-lg border border-border">
                <h3 class="text-lg font-semibold mb-4 text-text">Usage</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-text-muted">Used Space:</span>
                    <span class="font-medium text-text">{formatGigabytes(storageStats().used)} GB</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Free Space:</span>
                    <span class="font-medium text-text">{formatGigabytes(storageStats().total - storageStats().used)} GB</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-text-muted">Total Space:</span>
                    <span class="font-medium text-text">{formatGigabytes(storageStats().total)} GB</span>
                  </div>
                </div>
              </div>
              
              <div class="p-6 bg-background rounded-lg border border-border">
                <h3 class="text-lg font-semibold mb-4 text-text">Items</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-text-muted">Files:</span>
                    <span class="font-medium text-text">{storageStats().files}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="p-6 bg-background rounded-lg border border-border">
              <h3 class="text-lg font-semibold mb-4 text-text">Storage Tips</h3>
              <ul class="list-disc pl-5 space-y-2">
                <li class="text-text-muted">Files in the Bin still count towards your storage usage</li>
                <li class="text-text-muted">Empty your Bin to free up space</li>
                <li class="text-text-muted">Large files can be compressed to save space</li>
                <li class="text-text-muted">Consider upgrading your plan if you're running low on space</li>
              </ul>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
