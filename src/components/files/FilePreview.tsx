import { Component, createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { FileItem, FilePreviewData } from '../types/fileType';
import { fileService } from '../services/fileService';
import { notificationService } from '../common/Notification';
import Spinner from '../widgets/Spinner';
import { formatFileSize } from '../utilities/fileSizeFormatter';
import Loading from '../common/Loading';

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  getPreviewData: (fileId: string) => Promise<FilePreviewData | null>;
}

const FilePreview: Component<FilePreviewProps> = (props) => {
  const [preview, setPreview] = createSignal<FilePreviewData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const size = props.size || 'md';
  
  createEffect(() => {
    // Only load preview when the component is open and we have a file
    if (props.isOpen !== false && props.file) {
      loadPreview();
    }
  });

  onCleanup(() => {
    // Clean up any resources when component unmounts
    const currentPreview = preview();
    if (currentPreview?.url) {
      URL.revokeObjectURL(currentPreview.url);
    }
  });

  const loadPreview = async () => {
    if (props.file.isFolder) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading preview for file:', props.file.id);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Preview generation timed out')), 10000); // 10 second timeout
      });
      
      // Race between the actual preview fetch and timeout
      const data = await Promise.race([
        props.getPreviewData(props.file.id),
        timeoutPromise
      ]);
      
      console.log('Preview data received:', data);
      
      if (!data) {
        throw new Error('Failed to load file preview');
      }
      
      // Create object URL for blob data if needed
      if (data.blob) {
        data.url = URL.createObjectURL(data.blob);
      }
      
      setPreview(data);
      console.log('Preview state set:', preview());
    } catch (err) {
      console.error('Error loading preview:', err);
      const isTimeout = err.message === 'Preview generation timed out';
      const errorMessage = isTimeout ? 
        'Preview generation timed out. The file might be too large or in an unsupported format.' : 
        err instanceof Error ? err.message : 'Failed to load preview';
      
      setError(errorMessage);
      notificationService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };
  
  // Add keyboard event listener
  createEffect(() => {
    if (props.isOpen !== false) {
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  });
  
  // Render preview based on file type
  const renderPreview = () => {
    if (loading()) {
      return (
        <div class="flex items-center justify-center h-full">
          <Loading size="lg" />
        </div>
      );
    }
    
    if (error()) {
      return (
        <div class="flex flex-col items-center justify-center h-full text-text-muted">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-lg font-medium">Preview not available</p>
          <p class="text-sm mt-1">{error() || 'Unable to generate preview for this file'}</p>
        </div>
      );
    }
    
    if (props.file.isFolder) {
      return (
        <div class="flex flex-col items-center justify-center h-full text-text-muted">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p class="text-lg font-medium">Folder: {props.file.name}</p>
          <p class="text-sm mt-1">Double-click to open folder</p>
        </div>
      );
    }
    
    const previewData = preview();
    if (!previewData) {
      return (
        <div class="flex flex-col items-center justify-center h-full text-text-muted">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium">No preview available</p>
          <p class="text-sm mt-1">Try downloading the file instead</p>
        </div>
      );
    }
    
    switch (previewData.type) {
      case 'image':
        console.log('Rendering image preview with URL:', previewData.url);
        return (
          <div class="flex items-center justify-center h-full">
            <img 
              src={previewData.url} 
              alt={props.file.name}
              class="max-h-full max-w-full object-contain"
              onError={(e) => {
                console.error('Error loading image:', e);
                setError('Failed to load image preview');
              }}
            />
          </div>
        );
        
      case 'pdf':
        return (
          <div class="w-full h-full">
            <iframe 
              src={previewData.url} 
              title={props.file.name}
              class="w-full h-full border-0"
              onError={(e) => {
                console.error('Error loading PDF:', e);
                setError('Failed to load PDF preview');
              }}
            />
          </div>
        );
        
      case 'text':
        return (
          <div class="w-full h-full overflow-auto bg-background-lighter p-4 rounded">
            <pre class="text-sm whitespace-pre-wrap font-mono text-text">
              {previewData.content || 'No content available'}
            </pre>
          </div>
        );
        
      case 'audio':
        return (
          <div class="flex flex-col items-center justify-center h-full">
            <audio controls class="w-full max-w-md">
              <source src={previewData.url} />
              Your browser does not support the audio element.
            </audio>
            <p class="mt-4 text-text">{previewData.name}</p>
          </div>
        );
        
      case 'video':
        return (
          <div class="flex items-center justify-center h-full">
            <video controls class="max-w-full max-h-full">
              <source src={previewData.url} />
              Your browser does not support the video element.
            </video>
          </div>
        );
        
      default:
        return (
          <div class="flex flex-col items-center justify-center h-full">
            <svg class="w-24 h-24 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-text-muted">Preview not available for this file type</p>
            <p class="text-text font-medium mt-2">{previewData.name}</p>
            <p class="text-text-muted mt-1">{formatFileSize(previewData.size)}</p>
          </div>
        );
    }
  };
  
  return (
    <Show when={props.isOpen !== false}>
      <Portal>
        <div class="fixed inset-0 bg-black/75 z-50 flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div class="bg-background p-4 flex items-center justify-between">
            <div class="flex items-center">
              <h3 class="text-lg font-medium">{props.file.name}</h3>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                props.onClose();
              }}
              class="p-2 rounded-full hover:bg-background-light text-text-muted hover:text-text"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Preview Content */}
          <div class="flex-1 overflow-auto p-4">
            {renderPreview()}
          </div>
          
          {/* Footer */}
          <div class="bg-background p-4 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileService.downloadAndSaveFile(props.file.id, props.file.name, props.file.isFolder);
              }}
              class="px-4 py-2 bg-primary text-white rounded flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default FilePreview; 