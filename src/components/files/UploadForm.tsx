import { createSignal, Show, For } from 'solid-js';
import { useFileUpload } from '../hooks/useFileUpload';
import Button from '../widgets/Button';

interface UploadFormProps {
  currentFolderId: string | null;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export default function UploadForm(props: UploadFormProps) {
  const [files, setFiles] = createSignal<File[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);
  const { uploadFiles, isUploading } = useFileUpload();
  
  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      setFiles(Array.from(input.files));
    }
  };
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging()) setIsDragging(true);
  };
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer?.files?.length) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files().length === 0) return;
    
    try {
      await uploadFiles(files(), props.currentFolderId);
      props.onClose();
      if (props.onUploadComplete) props.onUploadComplete();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-background-darker p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-medium text-text">Upload Files</h3>
          <button 
            onClick={props.onClose}
            class="text-text-muted hover:text-text"
            disabled={isUploading()}
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Drag and drop area */}
        <div 
          class={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors ${
            isDragging() 
              ? 'border-primary bg-primary/10' 
              : 'border-background-light hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg class="h-12 w-12 mx-auto mb-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p class="text-text mb-2">
            Drag and drop files here, or <span class="text-primary">browse</span>
          </p>
          <p class="text-text-muted text-sm">
            Upload multiple files at once
          </p>
          
          <input 
            type="file" 
            id="file-upload" 
            class="hidden" 
            multiple 
            onChange={handleFileChange}
          />
          <label 
            for="file-upload" 
            class="mt-4 inline-block px-4 py-2 bg-background text-text-muted rounded-md cursor-pointer hover:bg-background-light"
          >
            Select Files
          </label>
        </div>
        
        {/* File list */}
        <Show when={files().length > 0}>
          <div class="max-h-60 overflow-y-auto mb-4">
            <For each={files()}>
              {(file, index) => (
                <div class="flex items-center justify-between py-2 px-3 bg-background rounded-md mb-2">
                  <div class="flex items-center overflow-hidden">
                    <svg class="h-5 w-5 text-text-muted flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div class="truncate">
                      <p class="text-sm text-text truncate">{file.name}</p>
                      <p class="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(index())}
                    class="ml-2 text-text-muted hover:text-danger flex-shrink-0"
                    disabled={isUploading()}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
        
        <div class="flex justify-end space-x-2">
          <Button 
            variant="secondary" 
            onClick={props.onClose}
            disabled={isUploading()}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={files().length === 0 || isUploading()}
          >
            {isUploading() ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
} 