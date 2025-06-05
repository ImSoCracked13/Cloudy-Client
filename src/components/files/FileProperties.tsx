import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { FileItem } from '../types/file';
import FilePreview from './FilePreview';
import { formatFileSize } from '../utilities/formatFileSize';

interface FilePropertiesProps {
  file: FileItem;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function FileProperties(props: FilePropertiesProps) {
  const [fileDetails, setFileDetails] = createSignal<FileItem>(props.file);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const formatSize = (bytes: number): string => {
    return formatFileSize(bytes);
  };
  
  const getFileTypeDescription = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.startsWith('text/')) return 'Text';
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
    return type || 'Unknown';
  };

  return (
    <Show when={props.isOpen !== false}>
      <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
        <div class="bg-background-darker p-6 rounded-lg shadow-xl border border-background-light/20 max-w-md w-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-text">File Properties</h3>
            <button 
              onClick={props.onClose} 
              class="text-text-muted hover:text-text p-1 rounded-full focus:outline-none"
              aria-label="Close properties"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Name</h4>
              <p class="text-text">{props.file.name}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Type</h4>
              <p class="text-text">{getFileTypeDescription(props.file.type)}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Size</h4>
              <p class="text-text">{formatSize(props.file.size)}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Location</h4>
              <p class="text-text">{props.file.path}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Created</h4>
              <p class="text-text">{formatDate(props.file.createdAt)}</p>
            </div>
            
            <div>
              <h4 class="text-sm font-semibold text-text-muted mb-1">Modified</h4>
              <p class="text-text">{formatDate(props.file.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}