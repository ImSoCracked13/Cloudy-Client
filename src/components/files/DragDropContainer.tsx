import { JSX, Show } from 'solid-js';
import { useDragDrop } from '../hooks/useDragDrop';
import { useFileUpload } from '../hooks/useFileUpload';
import { notificationService } from '../common/Notification';

interface DragDropContainerProps {
  children: JSX.Element;
  currentFolderId: string | null;
  onFilesUploaded?: () => void;
  onDrop?: (files: File[]) => void;
}

export default function DragDropContainer(props: DragDropContainerProps) {
  const { uploadFiles } = useFileUpload();
  
  const { 
    isDragging, 
    validationError, 
    clearValidationError,
    bindDragEvents 
  } = useDragDrop({
    maxFileSize: 200 * 1024 * 1024, // 200MB
    onDrop: handleFileDrop
  });
  
  async function handleFileDrop(files: File[]) {
    try {
      // If custom onDrop handler is provided, use it
      if (props.onDrop) {
        props.onDrop(files);
        return;
      }
      
      // Otherwise, handle file upload
      await uploadFiles(files, props.currentFolderId);
      
      // Notify parent component that files were uploaded
      if (props.onFilesUploaded) {
        props.onFilesUploaded();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
      notificationService.error(errorMessage);
    }
  }

  return (
    <div 
      class="relative w-full h-full"
      {...bindDragEvents}
    >
      {props.children}
      
      <Show when={isDragging()}>
        <div class="absolute inset-0 bg-background-darker/80 border-2 border-dashed border-primary rounded-md z-10 flex items-center justify-center">
          <div class="text-center p-6 rounded-lg">
            <div class="text-4xl mb-2 text-primary">
              <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="text-xl font-medium text-text">Drop files here</h3>
            <p class="mt-1 text-text-muted">Files will be uploaded to the current folder</p>
            
            <Show when={validationError()}>
              <div class="mt-3 py-2 px-3 bg-danger/20 text-danger rounded text-sm">
                {validationError()}
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
} 