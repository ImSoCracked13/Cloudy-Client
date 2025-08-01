import { Component, createSignal } from 'solid-js';
import { useDeleteForever } from '../../../hooks/files/bin/useDeleteForever';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';

interface DeleteForeverDialogProps {
  isOpen: boolean;
  files: any[];
  onClose: () => void;
  onComplete: () => void;
}

const DeleteForeverDialog: Component<DeleteForeverDialogProps> = (props) => {
  const { deleteForever, loading: deleteLoading, error: deleteError } = useDeleteForever();
  const [isProcessing, setIsProcessing] = createSignal(false);
  
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
  
  // Handle delete forever action
  const handleDeleteForever = async () => {
    if (props.files.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      let success = false;
      
      if (props.files.length === 1) {
        success = await deleteForever(props.files[0].id);
      }
      
      if (success) {
        props.onComplete();
        props.onClose();
      } else if (deleteError()) {
        throw new Error(deleteError());
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete files permanently'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Delete Forever"
    >
      <div class="p-4">
        <div class="mb-4">
          <p class="mb-2 font-medium text-error">
            Warning: This action cannot be undone!
          </p>
          
          <p class="mb-4">
            Are you sure you want to permanently delete this item?
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
          
          {deleteError() && (
            <div class="mt-4 text-error text-sm">
              {deleteError()}
            </div>
          )}
        </div>
      </div>
      
      <div class="p-4 border-t border-background-lighter flex justify-end gap-2">
        <Button
          onClick={props.onClose}
          variant="secondary"
          disabled={isProcessing() || deleteLoading()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeleteForever}
          variant="danger"
          loading={isProcessing() || deleteLoading()}
          disabled={isProcessing() || deleteLoading()}
        >
          Delete Forever
        </Button>
      </div>
    </Dialog>
  );
};

export default DeleteForeverDialog;
