import { Component, createSignal } from 'solid-js';
import { useRestore } from '../../../hooks/files/bin/useRestore';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';


interface RestoreDialogProps {
  isOpen: boolean;
  files: any[];
  onClose: () => void;
  onComplete: () => void;
}

const RestoreDialog: Component<RestoreDialogProps> = (props) => {
  const { restore, loading: restoreLoading, error: restoreError } = useRestore();
  const { getDriveFiles } = useFilesList();
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Check if file exists in Drive
  const fileExistsInDrive = (fileName: string) => {
    return getDriveFiles().some(file => file.name === fileName);
  };

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
  
  // Handle restore action
  const handleRestore = async () => {
    if (props.files.length === 0) return;
    
    const fileToRestore = props.files[0];

    // Check if file with same name already exists in Drive
    if (fileExistsInDrive(fileToRestore.name)) {
      const errorMsg = `A file named "${fileToRestore.name}" already exists in Drive. Please delete it.`;
      setError(errorMsg);
      toastService.warning(errorMsg);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await restore(props.files[0].id);
      
      if (success) {
        props.onComplete();
        props.onClose();
      } else if (restoreError()) {
        setError(restoreError());
      }
    } catch (error) {
      setError('Failed to restore files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Restore Files"
    >
      <div class="p-4">
        <div class="mb-4">
          <p class="mb-4">
            Are you sure you want to restore this item to its original location?
          </p>
          
          <div class="max-h-40 overflow-y-auto border border-background-light rounded-md p-2 mb-4">
            {props.files.map((file) => (
              <div class="py-1 border-b border-background-light last:border-0">
                <div class="font-medium text-sm">{file.name}</div>
                <div class="text-xs text-text-muted">{formatFileSize(file.size || 0)}</div>
              </div>
            ))}
          </div>
          
          <div class="text-sm">
            <p>Total size: {formatFileSize(totalSize())}</p>
          </div>
          
          {(error() || restoreError()) && (
            <div class="mt-4 text-error text-sm">
              {error() || restoreError()}
            </div>
          )}
        </div>
      </div>
      
      <div class="p-4 border-t border-background-lighter flex justify-end gap-2">
        <Button
          onClick={props.onClose}
          variant="secondary"
          disabled={isProcessing() || restoreLoading()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRestore}
          variant="primary"
          loading={isProcessing() || restoreLoading()}
          disabled={isProcessing() || restoreLoading()}
        >
          Restore
        </Button>
      </div>
    </Dialog>
  );
};

export default RestoreDialog;
