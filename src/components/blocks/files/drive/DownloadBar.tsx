import { createSignal, Show, For, createEffect, onCleanup } from 'solid-js';
import { useDownload } from '../../../hooks/files/drive/useDownload';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface DownloadBarProps {
  isOpen: boolean;
  onClose: () => void;
  files: any[]; // Files to download
  onDownloadComplete?: () => void;
}

interface DownloadItem {
  id: string;
  file: {
    id: string;
    name: string;
    size: number;
  };
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

export default function DownloadBar(props: DownloadBarProps) {
  const { downloadFile, progress: downloadProgress } = useDownload();
  const [downloads, setDownloads] = createSignal<DownloadItem[]>([]);
  const [currentDownloadIndex, setCurrentDownloadIndex] = createSignal(-1);
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle clearing completed downloads
  const handleClearCompleted = () => {
    try {
      setDownloads(prev => prev.filter(item => item.status !== 'completed'));
    } catch (error) {
      toastService.error('Error clearing downloads');
    }
  };
  
  
  // Calculate overall progress
  const overallProgress = () => {
    const currentDownloads = downloads();
    if (currentDownloads.length === 0) return 0;
    
    const totalProgress = currentDownloads.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / currentDownloads.length);
  };
  
  // Count completed downloads
  const completedDownloads = () => {
    return downloads().filter(item => item.status === 'completed').length;
  };
  
  // Count failed downloads
  const failedDownloads = () => {
    return downloads().filter(item => item.status === 'error').length;
  };
  
  // Count total downloads
  const totalDownloads = () => {
    return downloads().length;
  };
  
  // Add files to download queue
  const addToDownloadQueue = (files: any[]) => {
    const newDownloads = files.map(file => ({
      id: `download-${file.id}-${Date.now()}`,
      file: {
        id: file.id,
        name: file.name,
        size: file.size || 0,
      },
      progress: 0,
      status: 'pending' as const
    }));
    
    setDownloads(prev => [...prev, ...newDownloads]);
    return newDownloads;
  };
  
  // Start download process
  const startDownloads = async () => {
    const currentDownloads = downloads();
    const pendingDownloads = currentDownloads.filter(item => item.status === 'pending');
    
    for (let i = 0; i < pendingDownloads.length; i++) {
      const download = pendingDownloads[i];
      try {
        // Update status to downloading
        setDownloads(prev => 
          prev.map(item => 
            item.id === download.id 
              ? { ...item, status: 'downloading' as const } 
              : item
          )
        );
        
        // Set current download index for progress tracking
        setCurrentDownloadIndex(i);
        
        // Perform the actual download
        const success = await downloadFile(
          download.file.id, 
          download.file.name, 
        );
        
        toastService.success(`Downloaded file successfully`);

        // Update status based on result
        setDownloads(prev => 
          prev.map(item => 
            item.id === download.id 
              ? { 
                  ...item, 
                  progress: success ? 100 : item.progress, 
                  status: success ? 'completed' as const : 'error' as const,
                  error: success ? undefined : 'Download failed'
                } 
              : item
          )
        );
      } catch (error) {
        console.error(`Error downloading ${download.file.name}:`, error);
        
        // Update status to error
        setDownloads(prev => 
          prev.map(item => 
            item.id === download.id 
              ? { 
                  ...item, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Download failed'
                } 
              : item
          )
        );
      }
    }
    
    // Reset current download index
    setCurrentDownloadIndex(-1);
    
    // Notify completion
    if (props.onDownloadComplete) {
      props.onDownloadComplete();
    }
  };
  
  // Update progress from the useDownload hook with batch updates
  createEffect(() => {
    const index = currentDownloadIndex();
    const currentProgress = downloadProgress;
    
    if (index >= 0 && currentProgress() > 0) {
      setDownloads(prev => {
        const pendingDownloads = prev.filter(item => item.status === 'pending' || item.status === 'downloading');
        if (index < pendingDownloads.length) {
          const downloadId = pendingDownloads[index].id;
          return prev.map(item => 
            item.id === downloadId 
              ? { ...item, progress: currentProgress() } 
              : item
          );
        }
        return prev;
      });
    }
  });
  
  // Start download process when dialog opens
  createEffect(() => {
    if (props.isOpen && props.files.length > 0 && downloads().length === 0) {
      // Add files to download queue
      addToDownloadQueue(props.files);
      // Start downloads
      startDownloads().then(() => {
        // Check for errors
        const hasErrors = downloads().some(item => item.status === 'error');
      });
    }
  });
  
  // Cleanup on component unmount
  onCleanup(() => {
    // Reset state
    setDownloads([]);
    setCurrentDownloadIndex(-1);
  });
  
  // Dialog content
  const dialogContent = (
    <div class="w-full">
      {/* Progress bar */}
      <div class="h-2 bg-background-light rounded-full mb-4">
        <div
          class="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${overallProgress()}%` }}
        />
      </div>
      
      <div class="mb-4 flex items-center justify-between">
        <div class="font-medium">File Downloads</div>
        <div class="text-sm text-text-muted">
          {completedDownloads()}/{totalDownloads()} completed
          {failedDownloads() > 0 && ` • ${failedDownloads()} failed`}
        </div>
      </div>
      
      {/* Download list */}
        <div class="max-h-60 overflow-y-auto">
          <For each={downloads()}>
            {(download) => (
              <div class="p-3 border-b border-background-light last:border-0">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm font-medium truncate flex-1" title={download.file.name}>
                    {download.file.name}
                  </div>
                  <div class="text-xs text-text-muted ml-2">
                    {formatFileSize(download.file.size)}
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  <div class="flex-1 h-1 bg-background-light rounded-full overflow-hidden">
                    <div
                      class={`h-full transition-all duration-300 ${
                        download.status === 'error' ? 'bg-error' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.round(download.progress)}%` }}
                    />
                  </div>
                  <div class="text-xs text-text-muted">
                    {download.status === 'completed' ? '100%' : `${Math.round(download.progress)}%`}
                  </div>
                </div>
                
                <Show when={download.status === 'error'}>
                  <div class="mt-1 text-xs text-error">
                    {download.error || 'Download failed'}
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
    </div>
  );

  // Dialog actions
  const dialogActions = (
    <>
      <Button 
        variant="ghost" 
        onClick={handleClearCompleted}
        disabled={completedDownloads() === 0}
      >
        Clear Completed
      </Button>
      <Button 
        variant="primary" 
        onClick={props.onClose}
      >
        Close
      </Button>
    </>
  );
  
  return (
    <Show when={props.isOpen}>
      <Dialog
        title="Downloading Files"
        isOpen={props.isOpen}
        onClose={props.onClose}
        size="md"
        actions={dialogActions}
      >
        {dialogContent}
      </Dialog>
    </Show>
  );
} 