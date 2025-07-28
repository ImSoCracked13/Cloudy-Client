import { Component, createSignal } from 'solid-js';
import { useDuplicate } from '../../../handlers/FileHandler';
import toastService from '../../../common/Notification';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import { type FileItem } from '../../../handlers/FileHandler';

interface DuplicateDialogProps {
  isOpen: boolean;
  file: FileItem;
  onClose: () => void;
  onComplete: () => void;
}

const DuplicateDialog: Component<DuplicateDialogProps> = (props) => {
  const { duplicateFile } = useDuplicate();
  const [isLoading, setIsLoading] = createSignal(false);

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      const result = await duplicateFile(props.file.id);
      if (result) {
        props.onComplete();
      } else {
        toastService.error('Failed to duplicate file');
        props.onClose();
      }
    } catch (error) {
      toastService.error('Failed to duplicate file');
      props.onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading()) {
      props.onClose();
    }
  };

  // Type text based on file type
  const itemTypeText = props.file.mimeType ? props.file.mimeType.split('/')[1] : 'unknown';
  const title = `Make a Copy of ${itemTypeText}`;

  return (
    <Dialog
      title={title}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <div class="p-4">
        <div class="mb-4">
          <p class="mb-4">
            Do you want to make a copy of "{props.file.name}"?
          </p>
        </div>
        
        <div class="flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading()}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDuplicate}
            disabled={isLoading()}
            loading={isLoading()}
          >
            Duplicate
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default DuplicateDialog;
