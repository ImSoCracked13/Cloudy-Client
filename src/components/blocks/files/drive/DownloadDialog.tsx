import { createSignal, Show, For } from 'solid-js';
import { useDownload } from '../../../hooks/files/drive/useDownload';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import DownloadBar from './DownloadBar';

export interface DownloadDialogProps {
  isOpen: boolean;
  files: any[]; // Files to download
  onClose: () => void;
  onComplete?: () => void;
}

export default function DownloadDialog(props: DownloadDialogProps) {
  const { loading: downloadLoading, error: downloadError } = useDownload();
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showDownloadBar, setShowDownloadBar] = createSignal(false);
  
  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate total size of all files
  const totalSize = () => {
    return props.files.reduce((total, file) => total + (file.size || 0), 0);
  };
  
  // Handle download action
  const handleDownload = () => {
    if (props.files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setShowDownloadBar(true);
  };
  
  // Handle download completion
  const handleDownloadComplete = () => {
    setShowDownloadBar(false);
    if (props.onComplete) {
      props.onComplete();
    }
  };

  // Handle download bar close
  const handleDownloadBarClose = () => {
    setShowDownloadBar(false);
    props.onClose();
  };
  
  return (
    <>
      <Dialog
        title="Download File"
        isOpen={props.isOpen && !showDownloadBar()}
        onClose={props.onClose}
        size="md"
      >
        <div class="space-y-4">
          <p class="text-gray-200 mb-4">
            {props.files.length === 1 
              ? 'Are you sure you want to download this file?' 
              : `Are you sure you want to download these ${props.files.length} files?`}
          </p>
            
          <div class="max-h-40 overflow-y-auto border border-background-light rounded-md p-3 bg-background/50">
            <For each={props.files}>
              {(file) => (
                <div class="py-1.5 border-b border-background-light last:border-0 flex items-center">
                  <div class="flex-1">
                    <div class="font-medium text-sm text-white">{file.name}</div>
                    <div class="text-xs text-gray-400">{formatFileSize(file.size || 0)}</div>
                  </div>
                </div>
              )}
            </For>
          </div>
            
          <div class="text-sm text-gray-400">
            Total size: <span class="text-white">{formatFileSize(totalSize())}</span>
          </div>
            
          <Show when={error() || downloadError()}>
            <div class="mt-4 text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800">
              {error() || downloadError()}
            </div>
          </Show>
        </div>
          
        <div class="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={props.onClose}
            disabled={isProcessing() || downloadLoading()}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={isProcessing() || downloadLoading()}
            loading={isProcessing() || downloadLoading()}
          >
            Download
          </Button>
        </div>
      </Dialog>
      
      <Show when={showDownloadBar()}>
        <DownloadBar
          isOpen={true}
          onClose={handleDownloadBarClose}
          files={props.files}
          onDownloadComplete={handleDownloadComplete}
        />
      </Show>
    </>
  );
}
