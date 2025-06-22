import { createEffect, For, Show } from 'solid-js';
import { useFileUpload } from '../hooks/useFileUpload';
import { FileUploadProgress } from '../hooks/useFileUpload';

export default function UploadBar() {
  const { isUploading, uploadProgress, clearUploadProgress } = useFileUpload();
  
  // Auto-hide completed uploads after 3 seconds
  createEffect(() => {
    const progressItems = Object.values(uploadProgress);
    const completedItems = progressItems.filter(item => item.status === 'completed');
    
    if (completedItems.length > 0) {
      const timer = setTimeout(() => {
        completedItems.forEach(item => {
          clearUploadProgress(item.fileId);
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  });
  
  const progressItems = () => Object.values(uploadProgress);
  
  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg class="h-4 w-4 text-text-muted animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploading':
        return (
          <svg class="h-4 w-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'completed':
        return (
          <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg class="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  const getStatusText = (item: FileUploadProgress) => {
    switch (item.status) {
      case 'pending':
        return 'Pending...';
      case 'uploading':
        return `${Math.round(item.progress)}%`;
      case 'completed':
        return 'Completed';
      case 'error':
        return item.error || 'Failed';
    }
  };
  
  // Only show the upload bar if there are uploads in progress
  if (progressItems().length === 0) {
    return null;
  }
  
  return (
    <div class="fixed bottom-0 right-0 p-4 z-50">
      <div class="bg-background-darker rounded-lg shadow-lg overflow-hidden max-w-md w-full">
        <div class="bg-background-darkest px-4 py-2 flex justify-between items-center">
          <div class="flex items-center">
            <svg class="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span class="text-sm font-medium text-text">
              {isUploading() ? 'Uploading Files' : 'Upload Complete'}
            </span>
          </div>
          <button 
            onClick={() => clearUploadProgress()}
            class="text-text-muted hover:text-text"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="max-h-60 overflow-y-auto">
          <For each={progressItems()}>
            {(item) => (
              <div class="px-4 py-2 border-t border-background-light">
                <div class="flex justify-between items-center mb-1">
                  <div class="flex items-center">
                    {getStatusIcon(item.status)}
                    <span class="ml-2 text-sm text-text truncate max-w-[200px]">
                      {item.fileName}
                    </span>
                  </div>
                  <span class="text-xs text-text-muted">
                    {getStatusText(item)}
                  </span>
                </div>
                
                <Show when={item.status === 'uploading'}>
                  <div class="w-full bg-background-light rounded-full h-1.5 mt-1">
                    <div 
                      class="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
} 