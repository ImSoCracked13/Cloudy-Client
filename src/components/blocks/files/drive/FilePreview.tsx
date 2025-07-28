import { Component, createSignal, createEffect, Show, onCleanup, onMount } from 'solid-js';
import { usePreview } from '../../../hooks/files/drive/usePreview';
import { useDownload } from '../../../hooks/files/drive/useDownload';
import Loading from '../../../common/Loading';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface FilePreviewProps {
  file: any; // File object from FileHandler
  onClose: () => void;
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FilePreview: Component<FilePreviewProps> = (props) => {
  const { getPreview } = usePreview();
  const { downloadFile } = useDownload();
  const [preview, setPreview] = createSignal<any | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const size = props.size || 'lg'; // Changed default to 'lg'
  
  // Prevent background scrolling when preview is open
  onMount(() => {
    if (props.isOpen !== false) {
      document.body.style.overflow = 'hidden';
    }
  });

  // Restore background scrolling when preview is closed
  onCleanup(() => {
    document.body.style.overflow = '';
    
    // Clean up any resources when component unmounts
    const currentPreview = preview();
    if (currentPreview?.url && currentPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview.url);
    }
  });
  
  createEffect(() => {
    // Only load preview when the component is open and we have a file
    if (props.isOpen !== false && props.file) {
      loadPreview();
    }
  });

  const loadPreview = async () => {
    try {
      setLoading(true);
      const data = await getPreview(props.file.id);
      toastService.success('Preview file successfully');
      setPreview(data);
      setLoading(false);
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : 'Failed to load file preview'
      );
    }
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
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
  
  // Handle download
  const handleDownload = async () => {
    try {
      await downloadFile(props.file.id, props.file.name);
      toastService.success('Downloaded file successfully');
    } catch (error) {
      toastService.error(error instanceof Error ? error.message : 'Download failed');
    }
  };
  
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
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-lg font-medium text-white">Preview not available</p>
          <p class="text-sm mt-1">{error() || 'Unable to generate preview for this file'}</p>
        </div>
      );
    }
    
    const previewData = preview();
    if (!previewData) {
      return (
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
          <svg class="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-lg font-medium text-white">No preview available</p>
          <p class="text-sm mt-1">Try downloading the file instead</p>
          <Button
            variant="primary"
            onClick={handleDownload}
            class="mt-4"
          >
            Download File
          </Button>
        </div>
      );
    }
    
    switch (previewData.type) {
      case 'image':
        return (
          <div class="flex flex-col items-center justify-center h-full">
            <img 
              src={previewData.url} 
              alt={props.file.name}
              class="max-h-[calc(100vh-200px)] max-w-full object-contain" // Increased max height
              onError={(e) => {
                toastService.error('Failed to load image');
              }}
            />
            <Show when={error()}>
              <div class="mt-4 text-center text-gray-400">
                <p class="text-sm">{error()}</p>
                <Show when={previewData.url?.includes('cloudy-api.duckdns.org')}>
                  <a 
                    href={previewData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="mt-2 inline-block text-blue-400 hover:text-blue-300"
                  >
                    Open image in new tab
                  </a>
                </Show>
              </div>
            </Show>
          </div>
        );
        
      case 'pdf':
        return (
          <div class="w-full h-full flex flex-col">
            <div class="flex-1 min-h-0"> {/* This ensures the iframe can expand */}
              <iframe 
                src={previewData.url} 
                title={props.file.name}
                class="w-full h-full border-0"
                style="min-height: 70vh;" // Added minimum height
                onError={(e) => {
                  toastService.error('Failed to load PDF');
                }}
              />
            </div>
            {error() && (
              <div class="p-2 bg-red-900/50 text-red-200 text-sm">
                {error()}
              </div>
            )}
          </div>
        );
        
      case 'text':
        return (
          <div class="w-full h-full overflow-auto bg-gray-800 p-4 rounded">
            <pre class="text-sm whitespace-pre-wrap font-mono text-white">
              {previewData.content || 'No content available'}
            </pre>
          </div>
        );
        
      case 'audio':
        return (
          <div class="flex flex-col items-center justify-center h-full">
            <audio controls class="w-full max-w-md">
              <source src={previewData.url} type={`audio/${previewData.name.split('.').pop()}`} />
              Browser does not support the audio element.
            </audio>
            <p class="mt-4 text-white">{previewData.name}</p>
          </div>
        );
        
      case 'video':
        return (
          <div class="flex items-center justify-center h-full">
            <video controls class="max-w-full max-h-[calc(100vh-200px)]"> {/* Increased max height */}
              <source src={previewData.url} type={`video/${previewData.name.split('.').pop()}`} />
              Browser does not support the video element.
            </video>
          </div>
        );
        
      default:
        return (
          <div class="flex flex-col items-center justify-center h-full">
            <svg class="w-24 h-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-400">Preview not available for this file type</p>
            <p class="text-white font-medium mt-2">{previewData.name}</p>
            <p class="text-gray-400 mt-1">{previewData.size}</p>
          </div>
        );
    }
  };
  
  // Get size class for the preview container - Updated with larger sizes
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'max-w-xl h-[70vh]'; // Changed from max-h to h
      case 'md': return 'max-w-4xl h-[80vh]';
      case 'lg': return 'max-w-6xl h-[90vh]';
      case 'xl': return 'max-w-7xl h-[95vh]';
      default: return 'max-w-6xl h-[90vh]';
    }
  };
  
  return (
    <>
      <Show when={props.isOpen !== false}>
        <div class="fixed inset-0 z-[1000] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Overlay */}
          <div 
            class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onClose();
                }}
          />
          
          <div class="flex items-center justify-center min-h-screen p-4 relative z-[1001]">
            {/* Preview Container - Updated with larger default size */}
            <div 
              class={`bg-[#1E1E1E] rounded-lg shadow-2xl border border-gray-700 flex flex-col w-full ${getSizeClass()}`}
              style="transform: translateZ(0); will-change: transform;"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 class="text-lg font-medium text-white truncate max-w-[70%]">
                  {props.file.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    props.onClose();
                  }}
                  class="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/50"
                  aria-label="Close preview"
              >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Preview Content */}
              <div class="flex-1 overflow-hidden p-4" onClick={(e) => e.stopPropagation()}>
              {renderPreview()}
            </div>
            
            {/* Footer */}
              <div class="p-4 border-t border-gray-700 flex justify-between items-center">
                <div class="text-sm text-gray-400">
                  {props.file.size ? `${(props.file.size / 1024).toFixed(1)} KB` : ''}
                </div>
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  class="bg-blue-600 hover:bg-blue-700"
                >
                Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default FilePreview;