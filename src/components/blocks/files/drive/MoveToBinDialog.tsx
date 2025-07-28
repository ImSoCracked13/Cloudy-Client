import { createSignal, Show, For } from 'solid-js';
import { useMoveToBin } from '../../../hooks/files/drive/useMoveToBin';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';

export interface MoveToBinDialogProps {
  isOpen: boolean;
  files: any[]; // Files to move to bin
  onClose: () => void;
  onComplete?: () => void;
}

export default function MoveToBinDialog(props: MoveToBinDialogProps) {
  const { moveToBin, loading: moveLoading, error: moveError } = useMoveToBin();
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle move to bin action
  const handleMoveToBin = async () => {
    if (props.files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await moveToBin(props.files[0].id);
      
      if (success) {
        
        if (props.onComplete) {
          props.onComplete();
        }
        
        props.onClose();
      } else if (moveError()) {
        setError(moveError());
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to move files to bin';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog
      title="Move to Bin"
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <div class="p-4">
        <div class="mb-4">
          <p class="mb-2">
            Are you sure you want to move this item to the bin?
          </p>
          
          <div class="max-h-40 overflow-y-auto border border-background-light rounded-md p-2 mb-4">
            <For each={props.files}>
              {(file) => (
                <div class="py-1 border-b border-background-light last:border-0">
                  <div class="font-medium text-sm">{file.name}</div>
                  <div class="text-xs text-text-muted">{formatFileSize(file.size || 0)}</div>
                </div>
              )}
            </For>
          </div>
          
          <p class="text-sm text-text-muted">
            Items will now be in Bin.
            <br />
            You can restore them from the Bin.
          </p>
          
          <Show when={error() || moveError()}>
            <div class="mt-4 text-error text-sm">
              {error() || moveError()}
            </div>
          </Show>
        </div>
        
        <div class="flex justify-end space-x-2">
          <Button 
            onClick={props.onClose}
            variant="secondary"
            disabled={isProcessing() || moveLoading()}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMoveToBin}
            variant="danger"
            disabled={isProcessing() || moveLoading()}
            loading={isProcessing() || moveLoading()}
            leftIcon={
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Move to Bin
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
