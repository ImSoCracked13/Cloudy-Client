import { createSignal, Show, createEffect } from 'solid-js';
import { useRename } from '../../../hooks/files/drive/useRename';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import Input from '../../../widgets/Input';
import toastService from '../../../common/Notification';

export interface RenameDialogProps {
  isOpen: boolean;
  file: any; // File to rename
  onClose: () => void;
  onComplete?: (renamedFile: any) => void;
}

export default function RenameDialog(props: RenameDialogProps) {
  const { renameFile, loading: renameLoading, error: renameError } = useRename();
  const { fileExists } = useFilesList();
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [newName, setNewName] = createSignal('');
  const [fileExtension, setFileExtension] = createSignal('');
  
  // Extract filename without extension and the extension itself
  const extractNameAndExtension = (fullName: string) => {
    if (!fullName) return { name: '', extension: '' };
    const lastDotIndex = fullName.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      // No extension or hidden file (e.g., .gitignore)
      return { name: fullName, extension: '' };
    }
    return {
      name: fullName.substring(0, lastDotIndex),
      extension: fullName.substring(lastDotIndex)
    };
  };

  // Reset state when file changes or dialog opens
  // Only run when dialog is opened
  createEffect(() => {
    if (props.isOpen && props.file) {
      setIsProcessing(false);
      setError(null);
      const { name, extension } = extractNameAndExtension(props.file.name);
      setNewName(name);
      setFileExtension(extension);
    }
  });
  
  // Handle rename action
  const handleRename = async () => {
    // Combine name and extension for the final filename
    const finalName = newName() + fileExtension();
    
    if (!props.file || !finalName || finalName === props.file.name) return;
    
    // Check if the new name already exists (and it's not the current file)
    if (fileExists(finalName) && finalName !== props.file.name) {
      const errorMsg = `A file named "${finalName}" already exists. Please choose a different name.`;
      setError(errorMsg);
      toastService.warning(errorMsg);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const renamedFile = await renameFile(props.file.id, props.file.name, finalName);
      
      if (renamedFile) {
        // Show success notification
        
        // Notify parent component
        if (props.onComplete) {
          props.onComplete(renamedFile);
        }
        
        props.onClose();
      } else if (renameError()) {
        setError(renameError());
      }
    } catch (err) {
      console.error('Error renaming file:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog
      title={`Rename ${props.file?.name}`}
      
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <div class="p-4">
        <Show when={props.file}>
          <div class="mb-4">
            <p class="mb-4">
              Enter a new name for <span class="font-medium">{props.file?.name}</span>
            </p>
            
            <div class="mb-4">
              <Input
                id="rename-input"
                label="New name"
                type="text"
                value={newName()}
                onInput={(e) => setNewName(e.currentTarget.value)}
                disabled={isProcessing() || renameLoading()}
                autofocus
              />
              
              <Show when={fileExtension()}>
                <div class="text-sm text-text-muted mt-1">
                  The file extension <span class="font-mono">{fileExtension()}</span> will be preserved.
                </div>
              </Show>
            </div>
            
            <Show when={error() || renameError()}>
              <div class="text-error text-sm mb-4">
                {error() || renameError()}
              </div>
            </Show>
          </div>
          
          <div class="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={props.onClose}
              disabled={isProcessing() || renameLoading()}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRename}
              disabled={isProcessing() || renameLoading() || !newName().trim() || (newName() + fileExtension()) === props.file?.name}
              loading={isProcessing() || renameLoading()}
            >
              Rename
            </Button>
          </div>
        </Show>
      </div>
    </Dialog>
  );
}
