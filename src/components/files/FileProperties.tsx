import { Component, createSignal, createEffect, Show } from 'solid-js';
import { FileItem } from '../types/fileType';
import { formatFileSize } from '../utilities/fileSizeFormatter';
import { storageSynchronizer } from '../utilities/storageSynchronizer';
import Loading from '../common/Loading';

interface FilePropertiesProps {
  file: FileItem;
  onClose: () => void;
}

const FileProperties: Component<FilePropertiesProps> = (props) => {
  const [loading, setLoading] = createSignal(true);
  const [properties, setProperties] = createSignal<any>(null);

  createEffect(() => {
    loadProperties();
  });

  const loadProperties = async () => {
    try {
      setLoading(true);
      const details = await storageSynchronizer.getFileProperties(props.file);
      setProperties(details);
    } catch (error) {
      console.error('Error loading file properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getFileIcon = () => {
    if (props.file.isFolder) {
      return (
        <svg class="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }

    switch (props.file.type) {
      case 'image':
        return (
          <svg class="h-16 w-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg class="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9h4m-4 4h4m-4 4h4" />
          </svg>
        );
      case 'document':
      case 'word':
        return (
          <svg class="h-16 w-16 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'spreadsheet':
      case 'excel':
        return (
          <svg class="h-16 w-16 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'presentation':
      case 'powerpoint':
        return (
          <svg class="h-16 w-16 text-orange-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'video':
        return (
          <svg class="h-16 w-16 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg class="h-16 w-16 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'archive':
      case 'zip':
      case 'rar':
        return (
          <svg class="h-16 w-16 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case 'code':
        return (
          <svg class="h-16 w-16 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'text':
        return (
          <svg class="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  // Gets user-friendly storage location display
  const getStorageLocation = () => {
    const prop = properties();
    if (!prop) return 'Unknown';
    
    let location = prop.location || 'Drive';
    let path = prop.objectPath || '/';
    
    if (path === '/') {
      return `${location} (Root)`;
    }
    
    // Clean up path for display
    path = path.replace(/^\/+|\/+$/g, '');
    return `${location}/${path}`;
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay backdrop-blur-sm">
      <div class="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-background-lighter">
          <h2 class="text-lg font-medium text-text">File Properties</h2>
          <button 
            onClick={props.onClose} 
            class="p-2 rounded-full hover:bg-background-lighter text-text-muted hover:text-text transition-colors"
            aria-label="Close properties"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div class="flex-1 overflow-auto p-6">
          <Show when={loading()}>
            <div class="flex justify-center items-center py-12">
              <Loading size="lg" />
            </div>
          </Show>
          
          <Show when={!loading()}>
            <div class="flex flex-col md:flex-row gap-6">
              {/* File icon */}
              <div class="flex-shrink-0 flex justify-center">
                {getFileIcon()}
              </div>
              
              {/* File details */}
              <div class="flex-grow space-y-4">
                <div>
                  <h3 class="text-xl font-medium text-text break-words">{props.file.name}</h3>
                  <p class="text-text-muted">{props.file.isFolder ? 'Folder' : props.file.mimeType || 'File'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span class="text-text-muted">Location:</span>
                    <span class="text-text ml-2">{getStorageLocation()}</span>
                  </div>
                  
                  <div>
                    <span class="text-text-muted">Size:</span>
                    <span class="text-text ml-2">{formatFileSize(props.file.size)}</span>
                  </div>
                  
                  <div>
                    <span class="text-text-muted">Created:</span>
                    <span class="text-text ml-2">{formatDate(props.file.createdAt)}</span>
                  </div>
                  
                  <div>
                    <span class="text-text-muted">Modified:</span>
                    <span class="text-text ml-2">{formatDate(props.file.updatedAt)}</span>
                  </div>
                  
                  <div class="col-span-2">
                    <span class="text-text-muted">File ID:</span>
                    <span class="text-text ml-2 font-mono text-xs">{props.file.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
        
        {/* Footer */}
        <div class="p-4 border-t border-background-lighter flex justify-end">
          <button 
            onClick={props.onClose} 
            class="px-4 py-2 rounded-md bg-background-lighter text-text hover:bg-background-light transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileProperties;