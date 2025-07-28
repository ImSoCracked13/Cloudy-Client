import { Show, For, createEffect, createMemo } from 'solid-js';
import { useUpload } from '../../../hooks/files/drive/useUpload';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import Bar from '../../../widgets/Bar';
import toastService from '../../../common/Notification';

interface UploadBarProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  currentFolderId: string | null;
  onUploadComplete?: () => void;
}

export default function UploadBar(props: UploadBarProps) {
  const { 
    uploads, 
    clearCompleted, 
    clearAllUploads,
    addToUploadQueue, 
    startUploads, 
    retryUpload,
    loading 
  } = useUpload();

  createEffect(() => {
    if (props.isOpen && !hasActiveUploads() && uploads().length > 0) {
      // Call onUploadComplete immediately when uploads finish
      if (props.onUploadComplete) {
        props.onUploadComplete();
      }
      // Close immediately when uploads are complete
      props.onClose();
    }
  });
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle clearing completed uploads
  const handleClearCompleted = () => {
    try {
      clearCompleted();
      toastService.success('Cleared completed uploads');
    } catch (error) {
      toastService.error('Error clearing uploads');
    }
  };
  
  // Calculate overall progress
  const overallProgress = createMemo(() => {
    const currentUploads = uploads();
    if (currentUploads.length === 0) return 0;
    
    const totalProgress = currentUploads.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / currentUploads.length);
  });
  
  // Count completed uploads
  const completedUploads = createMemo(() => 
    uploads().filter(item => item.status === 'completed').length
  );
  
  // Count failed uploads
  const failedUploads = createMemo(() => 
    uploads().filter(item => item.status === 'error').length
  );
  
  // Count total uploads
  const totalUploads = createMemo(() => 
    uploads().length
  );

  // Check for failed uploads
  const hasFailedUploads = createMemo(() => 
    uploads().some(item => item.status === 'error')
  );

  // Check if any uploads are in progress
  const hasActiveUploads = createMemo(() =>
    uploads().some(item => item.status === 'uploading' || item.status === 'pending')
  );

  // Handle upload process
  const handleUpload = async () => {
    if (props.files.length === 0) return;
    
    try {
      // Add files to upload queue
      addToUploadQueue(props.files, props.currentFolderId);
      
      // Start uploads
      await startUploads(props.currentFolderId);
      
      // Show success toast after uploads complete
      toastService.success('Files uploaded successfully');
    } catch (error) {
      toastService.error('Failed to upload files');
    }
  };

  // Start upload process when dialog opens and we have files
  createEffect(() => {
    if (props.isOpen && props.files.length > 0 && uploads().length === 0) {
      handleUpload();
    }
  });

  // Cleanup on component unmount or when dialog closes
  createEffect(() => {
    if (!props.isOpen) {
      // Clear completed uploads when dialog closes to prepare for next upload
      setTimeout(() => {
        clearCompleted();
      }, 100); // Small delay to allow UI updates
    }
  });
  
  // Dialog content
  const dialogContent = (
    <div class="w-full">
      {/* Overall progress section */}
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium">Overall Progress</div>
          <div class="text-sm text-text-muted">
            {overallProgress()}% • {completedUploads()}/{totalUploads()} completed
            {failedUploads() > 0 && ` • ${failedUploads()} failed`}
          </div>
        </div>
        <Bar
          progress={overallProgress()}
          color={hasFailedUploads() ? 'danger' : 'primary'}
          size="md"
          animate={true}
          rounded={true}
        />
      </div>

      {/* Upload list */}
      <div class="max-h-60 overflow-y-auto">
        <Show when={uploads().length === 0}>
          <div class="p-4 text-center text-text-muted">
            No files in upload queue
          </div>
        </Show>
        
        <For each={uploads()}>
          {(upload) => (
            <div class="p-3 border-b border-background-light last:border-0">
              <div class="flex items-center justify-between mb-1">
                <div class="text-sm font-medium truncate flex-1" title={upload.file.name}>
                  {upload.file.name}
                  <Show when={upload.status === 'uploading'}>
                    <span class="ml-2 text-xs text-text-muted">(uploading...)</span>
                  </Show>
                </div>
                <div class="text-xs text-text-muted ml-2">
                  {formatFileSize(upload.file.size)}
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <div class="flex-1">
                  <Bar
                    progress={upload.progress}
                    color={upload.status === 'error' ? 'danger' : 
                          upload.status === 'completed' ? 'success' : 'primary'}
                    size="sm"
                    animate={true}
                    rounded={true}
                  />
                </div>
                <div class="text-xs text-text-muted min-w-[40px] text-right">
                  {upload.status === 'completed' ? '100%' : 
                  upload.status === 'error' ? 'Failed' : 
                  `${Math.round(upload.progress)}%`}
                </div>
              </div>
              
              <Show when={upload.status === 'error'}>
                <div class="mt-1 text-xs text-error">
                  {upload.error || 'Upload failed'}
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
      disabled={completedUploads() === 0}
    >
      Clear Completed
    </Button>
    <Show when={hasFailedUploads()}>
      <Button 
        variant="secondary" 
        onClick={() => {
          uploads()
            .filter(item => item.status === 'error')
            .forEach(item => retryUpload(item.file, props.currentFolderId));
        }}
        disabled={loading()}
      >
        Retry Failed
      </Button>
    </Show>
    <Button 
      variant="primary" 
      onClick={props.onClose}
      disabled={hasActiveUploads()}
    >
      {hasActiveUploads() ? 'Uploading...' : 'Close'}
    </Button>
  </>
  );
  
  return (
  <Dialog
    title="Uploading Files"
    isOpen={props.isOpen}
    onClose={props.onClose}
    size="md"
    actions={dialogActions}
  >
    {dialogContent}
  </Dialog>
  );
}