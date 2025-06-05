import { JSX, createEffect, createSignal, Show } from 'solid-js';
import { FileItem } from '../types/file';

interface FilePreviewProps {
  file: FileItem;
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
  isOpen?: boolean;
  readOnly?: boolean;
}

export default function FilePreview(props: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const size = props.size || 'md';
  
  const sizeClasses = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };
  
  const getIconSize = () => sizeClasses[size];
  
  const getFileTypeIcon = () => {
    const fileExtension = props.file.name.split('.').pop()?.toLowerCase() || '';
    
    // Image files
    if (props.file.type.startsWith('image/')) {
      return (
        <svg class="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Video files
    if (props.file.type.startsWith('video/')) {
      return (
        <svg class="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Audio files
    if (props.file.type.startsWith('audio/')) {
      return (
        <svg class="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    
    // PDF files
    if (fileExtension === 'pdf') {
      return (
        <svg class="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Text files
    if (props.file.type.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(fileExtension)) {
      return (
        <svg class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    // Other files
    return (
      <svg class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };
  
  const isPreviewable = () => {
    return props.file.type.startsWith('image/') || 
           props.file.type.startsWith('video/') || 
           props.file.type.startsWith('audio/') ||
           props.file.type.startsWith('text/') ||
           props.file.thumbnailUrl;
  };
  
  // Load preview URL if available
  createEffect(() => {
    if (props.file && props.file.thumbnailUrl) {
      setPreviewUrl(props.file.thumbnailUrl);
    } else if (props.file && props.file.type.startsWith('image/')) {
      // In a real app, you would fetch the image URL from your service
      setPreviewUrl(`/api/files/${props.file.id}/preview`);
    } else {
      setPreviewUrl(null);
    }
  });
  
  return (
    <Show when={props.isOpen !== false}>
      <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
        <div class={`bg-background-darker p-6 rounded-lg shadow-xl border border-background-light/20 ${getIconSize()}`}>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-text">{props.file.name}</h3>
            <button 
              onClick={props.onClose} 
              class="text-text-muted hover:text-text p-1 rounded-full focus:outline-none"
              aria-label="Close preview"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="bg-background-darkest rounded-md border border-background-light/10 p-4 mb-4 flex items-center justify-center">
            <Show 
              when={isPreviewable() && previewUrl()}
              fallback={
                <div class="py-8 flex flex-col items-center justify-center">
                  {getFileTypeIcon()}
                  <p class="mt-4 text-text-muted text-sm">Preview not available</p>
                </div>
              }
            >
              <Show when={props.file.type.startsWith('image/')}>
                <img 
                  src={previewUrl() || ''} 
                  alt={props.file.name} 
                  class="max-w-full max-h-[60vh] object-contain rounded"
                />
              </Show>
              
              <Show when={props.file.type.startsWith('video/')}>
                <video 
                  controls 
                  class="max-w-full max-h-[60vh]"
                  src={previewUrl() || ''}
                >
                  Your browser does not support the video tag.
                </video>
              </Show>
              
              <Show when={props.file.type.startsWith('audio/')}>
                <audio 
                  controls 
                  class="w-full"
                  src={previewUrl() || ''}
                >
                  Your browser does not support the audio tag.
                </audio>
              </Show>
            </Show>
          </div>
          
          <div class="flex justify-between items-center text-sm text-text-muted">
            <div>{(props.file.size / 1024).toFixed(2)} KB</div>
            <div>{new Date(props.file.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </Show>
  );
} 