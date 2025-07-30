import { Component, createSignal } from 'solid-js';
import { useEmptyBin } from '../../../hooks/files/bin/useEmptyBin';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface EmptyBinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const EmptyBinDialog: Component<EmptyBinDialogProps> = (props) => {
  const { emptyBin, loading: emptyLoading, error: emptyError } = useEmptyBin();
  const [isProcessing, setIsProcessing] = createSignal(false);
  
  // Check if there are any files in the Drive

  // Handle empty bin action
  const handleEmptyBin = async () => {
    setIsProcessing(true);
    
    try {
      const success = await emptyBin();
      
      if (success) {
        toastService.success('Bin emptied successfully');
        props.onComplete();
        props.onClose();
      } else if (emptyError()) {
        toastService.error(emptyError() || 'Failed to empty bin');
      }
    } catch (error) {
      toastService.error(error instanceof Error ? error.message : 'Failed to empty bin');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Empty Bin"
    >
      <div class="p-4">
        <p class="text-sm text-text-muted">
          Are you sure you want to empty the bin? This action cannot be undone.
        </p>
        
        {emptyError() && (
          <div class="mt-4 text-error text-sm">
            {emptyError()}
          </div>
        )}
      </div>
      
      <div class="p-4 border-t border-background-lighter flex justify-end gap-2">
        <Button
          onClick={props.onClose}
          variant="secondary"
          disabled={isProcessing() || emptyLoading()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleEmptyBin}
          variant="danger"
          loading={isProcessing() || emptyLoading()}
          disabled={isProcessing() || emptyLoading()}
        >
          Empty Bin
        </Button>
      </div>
    </Dialog>
  );
};

export default EmptyBinDialog;
