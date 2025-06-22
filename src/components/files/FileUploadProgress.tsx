import { Component, createSignal, Show, For } from 'solid-js';
import { formatFileSize } from '../utilities/fileSizeFormatter';

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  bytesUploaded?: number;
}

interface FileUploadProgressProps {
  uploads: UploadTask[];
  onCancelUpload: (taskId: string) => void;
  onClose: () => void;
}

const FileUploadProgress: Component<FileUploadProgressProps> = (props) => {
  const [expanded, setExpanded] = createSignal(true);

  const totalFiles = () => props.uploads.length;
  const completedFiles = () => props.uploads.filter(task => task.status === 'completed').length;
  const failedFiles = () => props.uploads.filter(task => task.status === 'error').length;
  const inProgressFiles = () => props.uploads.filter(task => 
    task.status === 'uploading' || task.status === 'pending'
  ).length;

  const overallProgress = () => {
    if (totalFiles() === 0) return 0;
    
    const totalProgress = props.uploads.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / totalFiles());
  };

  const progressBarColor = () => {
    if (failedFiles() > 0) return 'bg-error';
    if (completedFiles() === totalFiles()) return 'bg-success';
    return 'bg-primary';
  };

  const canClose = () => {
    return completedFiles() + failedFiles() === totalFiles();
  };

  const statusIcon = (status: UploadTask['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg class="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'uploading':
        return (
          <svg class="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        );
      default:
        return (
          <svg class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div class="fixed bottom-4 right-4 z-50 w-full max-w-md bg-background rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        class="p-3 bg-background-darker flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded())}
      >
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
          <div>
            <h3 class="font-medium text-text">Uploading Files</h3>
            <p class="text-xs text-text-muted">
              {completedFiles()} of {totalFiles()} complete
              {failedFiles() > 0 && ` • ${failedFiles()} failed`}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Show when={canClose()}>
            <button 
              onClick={(e) => { e.stopPropagation(); props.onClose(); }} 
              class="p-1 rounded-full hover:bg-background-light text-text-muted hover:text-text"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Show>
          <svg 
            class={`w-5 h-5 transition-transform ${expanded() ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-background-lighter h-1">
        <div 
          class={`h-full ${progressBarColor()}`} 
          style={{ width: `${overallProgress()}%` }}
        ></div>
      </div>

      {/* File list */}
      <Show when={expanded()}>
        <div class="max-h-60 overflow-y-auto p-2">
          <For each={props.uploads}>
            {(task) => (
              <div class={`p-2 rounded-md mb-2 ${task.status === 'error' ? 'bg-error bg-opacity-10' : 'bg-background-lighter'}`}>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 overflow-hidden">
                    {statusIcon(task.status)}
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-text truncate" title={task.file.name}>
                        {task.file.name}
                      </p>
                      <p class="text-xs text-text-muted">
                        {formatFileSize(task.file.size)} 
                        {task.status === 'uploading' && task.bytesUploaded && ` • ${formatFileSize(task.bytesUploaded)} uploaded`}
                      </p>
                      <Show when={task.error}>
                        <p class="text-xs text-error mt-1">{task.error}</p>
                      </Show>
                    </div>
                  </div>
                  
                  <Show when={task.status === 'uploading' || task.status === 'pending'}>
                    <button 
                      onClick={() => props.onCancelUpload(task.id)}
                      class="p-1 rounded-full hover:bg-background-light text-text-muted hover:text-error"
                      title="Cancel upload"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Show>
                </div>
                
                <Show when={task.status === 'uploading'}>
                  <div class="w-full bg-background-light h-1 mt-2 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary" 
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default FileUploadProgress; 