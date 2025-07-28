import { Component, createSignal, createEffect } from 'solid-js';
import { useProperties } from '../../../hooks/files/joints/useProperties';
import Loading from '../../../common/Loading';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';
import { type FileItem } from '../../../handlers/FileHandler';

interface FilePropertiesProps {
  file: FileItem;
  onClose: () => void;
}

const FileProperties: Component<FilePropertiesProps> = (props) => {
  const propertiesHook = useProperties();
  const [properties, setProperties] = createSignal<FileItem | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // Load properties on mount
  createEffect(() => {
    loadProperties();
  });

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await propertiesHook.loadProperties(props.file.id);
      toastService.info('File properties loaded');
      setProperties(details);
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : 'Failed to load file properties'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div 
        class="bg-[#1E1E1E] rounded-lg shadow-2xl w-[480px] overflow-hidden border border-background-light"
        style="transform: translateZ(0); backface-visibility: hidden;"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-background-light">
          <h2 class="text-lg font-medium text-white">File Properties</h2>
          <button 
            onClick={props.onClose} 
            class="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-background-light/30"
            aria-label="Close properties"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div class="px-6 py-4">
          {loading() && (
            <div class="flex justify-center items-center h-32">
              <Loading />
            </div>
          )}

          {error() && (
            <div class="text-red-400 text-center p-4 bg-red-900/20 rounded border border-red-800">
              {error()}
            </div>
          )}

          {!loading() && !error() && properties() && (
            <div class="space-y-5">
              {/* File Icon and Name */}
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg text-white font-medium">{properties()?.name}</h3>
                  <p class="text-sm text-gray-400">{properties()?.mimeType}</p>
                </div>
              </div>
              
              {/* File Details */}
              <div class="space-y-3 text-sm bg-background/30 rounded-md p-4">
                <div class="flex items-center">
                  <span class="text-gray-400 w-24">Location:</span>
                  <span class="text-white">{properties()?.location}</span>
                </div>
                <div class="flex items-center">
                  <span class="text-gray-400 w-24">Size:</span>
                  <span class="text-white">{(properties()?.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                <div class="flex items-center">
                  <span class="text-gray-400 w-24">Created:</span>
                  <span class="text-white">{new Date(properties()?.createdAt || '').toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  </div>
                <div class="flex items-center">
                  <span class="text-gray-400 w-24">File ID:</span>
                  <span class="text-white font-mono text-xs">{properties()?.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div class="p-4 border-t border-gray-700">
          <Button
            variant="primary"
            onClick={props.onClose} 
            fullWidth
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileProperties;