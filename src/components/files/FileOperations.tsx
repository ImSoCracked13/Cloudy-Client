import { createSignal, createEffect, Show } from 'solid-js';
import { FileItem } from '../types/fileType';
import { webSocketService } from '../services/webSocketService';
import { notificationService } from '../common/Notification';
import FileProperties from './FileProperties';
import FilePreview from './FilePreview';
import Dialog from '../widgets/Dialog';
import Button from '../widgets/Button';
import Input from '../widgets/Input';
import { fileService } from '../services/fileService';

interface FileOperationsProps {
  location: 'Drive' | 'Bin';
  currentPath: string;
  selectedFile: FileItem | null;
  onOperationComplete: () => void;
}

export default function FileOperations(props: FileOperationsProps) {
  const [showPreview, setShowPreview] = createSignal<boolean>(false);
  const [showProperties, setShowProperties] = createSignal<boolean>(false);
  const [showRenameDialog, setShowRenameDialog] = createSignal<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal<boolean>(false);
  const [showRestoreDialog, setShowRestoreDialog] = createSignal<boolean>(false);
  const [showDeleteForeverDialog, setShowDeleteForeverDialog] = createSignal<boolean>(false);
  const [isProcessing, setIsProcessing] = createSignal<boolean>(false);
  const [newName, setNewName] = createSignal<string>('');
  const [showDuplicateDialog, setShowDuplicateDialog] = createSignal<boolean>(false);
  const [duplicateName, setDuplicateName] = createSignal<string>('');
  
  /**
   * Handle file preview
   */
  const handlePreview = async () => {
    if (!props.selectedFile) return;
    
    setShowPreview(true);
  };
  
  /**
   * Handle file download
   */
  const handleDownload = async () => {
    try {
      setIsProcessing(true);
    if (!props.selectedFile) return;
    
      await fileService.downloadFile(
        props.selectedFile.id, 
        props.selectedFile.name
      );
    
      setIsProcessing(false);
      props.onOperationComplete();
    } catch (error) {
      console.error('Error downloading file:', error);
      notificationService.error('Failed to download file');
      setIsProcessing(false);
    }
  };
  
  /**
   * Open rename dialog
   */
  const handleRenameClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!props.selectedFile) return;
    
    // Separate filename from extension
    const fullName = props.selectedFile.name;
    const hasExtension = fullName.includes('.') && !props.selectedFile.isFolder && !fullName.startsWith('.');
    const extension = hasExtension ? fullName.substring(fullName.lastIndexOf('.')) : '';
    const baseName = hasExtension ? fullName.substring(0, fullName.lastIndexOf('.')) : fullName;
    
    // Set only the base name without extension
    setNewName(baseName);
    
    // Store extension in a data attribute to be added back when saving
    const renameDialog = document.getElementById('rename-dialog');
    if (renameDialog) {
      renameDialog.dataset.extension = extension;
    }
    
    setShowRenameDialog(true);
  };
  
  /**
   * Handle rename file
   */
  const handleRename = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!props.selectedFile || !newName()) return;
    
    setIsProcessing(true);
    
    try {
      // Get extension from data attribute
      const renameDialog = document.getElementById('rename-dialog');
      const extension = renameDialog?.dataset.extension || '';
      
      // Combine new name with extension
      const fullNewName = newName() + extension;
      
      // Call file service to rename
      const result = await fileService.renameFile(
        props.selectedFile.id, 
        props.selectedFile.name,
        fullNewName
      );
      
      if (result) {
        notificationService.success(`Renamed to "${fullNewName}"`);
        props.onOperationComplete();
      } else {
        throw new Error('Failed to rename file');
      }
    } catch (error) {
      console.error('Error renaming file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to rename file');
    } finally {
      setIsProcessing(false);
      setShowRenameDialog(false);
      setNewName('');
    }
  };
  
  /**
   * Open duplicate dialog
   */
  const handleDuplicateClick = () => {
    if (!props.selectedFile) return;
    
    // Show confirmation dialog
    setShowDuplicateDialog(true);
  };
  
  /**
   * Handle duplicate file
   */
  const handleDuplicate = async () => {
    if (!props.selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      // Call file service to duplicate
      const result = await fileService.duplicateFile(
        props.selectedFile.id,
        props.selectedFile.name
      );
    
      if (result) {
        notificationService.success(`Created copy of "${props.selectedFile.name}"`);
        props.onOperationComplete();
      } else {
        throw new Error('Failed to duplicate file');
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to duplicate file');
    } finally {
      setIsProcessing(false);
      setShowDuplicateDialog(false);
    }
  };
  
  /**
   * Open delete dialog
   */
  const handleDeleteClick = () => {
    if (!props.selectedFile) return;
    setShowDeleteDialog(true);
  };
  
  /**
   * Handle move to trash
   */
  const handleMoveToTrash = async () => {
    try {
    setIsProcessing(true);
      if (!props.selectedFile) return;
      
      await fileService.moveToTrash(props.selectedFile.id);
      
      // Notify WebSocket about storage change
      webSocketService.send('file_operation', { 
        operation: 'trash', 
        size: props.selectedFile.size 
      });
      
      props.onOperationComplete();
      notificationService.success(`"${props.selectedFile.name}" moved to trash`);
    } catch (error) {
      console.error('Error moving file to trash:', error);
      notificationService.error('Failed to move file to trash');
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };
  
  /**
   * Open restore dialog
   */
  const handleRestoreClick = () => {
    if (!props.selectedFile) return;
    setShowRestoreDialog(true);
  };
  
  /**
   * Handle restore from trash
   */
  const handleRestore = async () => {
    try {
      setIsProcessing(true);
    if (!props.selectedFile) return;
    
      await fileService.restoreFromTrash(props.selectedFile.id);
    
      props.onOperationComplete();
      notificationService.success(`"${props.selectedFile.name}" restored from trash`);
    } catch (error) {
      console.error('Error restoring file:', error);
      notificationService.error('Failed to restore file');
    } finally {
      setIsProcessing(false);
      setShowRestoreDialog(false);
    }
  };
  
  /**
   * Open delete forever dialog
   */
  const handleDeleteForeverClick = () => {
    if (!props.selectedFile) return;
    setShowDeleteForeverDialog(true);
  };
  
  /**
   * Handle delete permanently
   */
  const handleDeletePermanently = async () => {
    try {
      setIsProcessing(true);
      if (!props.selectedFile) return;
    
      await fileService.deleteFile(
        props.selectedFile.id,
        props.selectedFile.name
      );
      
      // Notify WebSocket about storage change
      webSocketService.send('file_operation', { 
        operation: 'delete', 
        size: props.selectedFile.size 
      });
      
      props.onOperationComplete();
      notificationService.success(`"${props.selectedFile.name}" permanently deleted`);
    } catch (error) {
      console.error('Error deleting file permanently:', error);
      notificationService.error('Failed to delete file permanently');
    } finally {
      setIsProcessing(false);
      setShowDeleteForeverDialog(false);
    }
  };
  
  /**
   * Handle showing file properties
   */
  const handleProperties = () => {
    if (!props.selectedFile) return;
    setShowProperties(true);
  };
  
  return (
    <>
      {/* Context Menu Operations */}
      <Show when={props.location === 'Drive'}>
        <div class="flex space-x-2">
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handlePreview}
            disabled={!props.selectedFile || isProcessing()}
            title="Preview"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handleDownload}
            disabled={!props.selectedFile || isProcessing()}
            title="Download"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handleRenameClick}
            disabled={!props.selectedFile || isProcessing()}
            title="Rename"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handleDuplicateClick}
            disabled={!props.selectedFile || isProcessing()}
            title="Duplicate"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-danger"
            onClick={handleDeleteClick}
            disabled={!props.selectedFile || isProcessing()}
            title="Move to Bin"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handleProperties}
            disabled={!props.selectedFile || isProcessing()}
            title="Properties"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </Show>
      
      <Show when={props.location === 'Bin'}>
        <div class="flex space-x-2">
          <button 
            class="p-2 rounded-md hover:bg-background-light text-text"
            onClick={handleRestoreClick}
            disabled={!props.selectedFile || isProcessing()}
            title="Restore"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-md hover:bg-background-light text-danger"
            onClick={handleDeleteForeverClick}
            disabled={!props.selectedFile || isProcessing()}
            title="Delete Forever"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </Show>
      
      {/* Dialogs */}
      <Show when={showPreview()}>
        <FilePreview 
          file={props.selectedFile!} 
          onClose={() => setShowPreview(false)}
          getPreviewData={(fileId) => fileService.getFilePreview(fileId)}
        />
      </Show>
      
      <Show when={showProperties()}>
        <FileProperties 
          file={props.selectedFile!} 
          onClose={() => setShowProperties(false)} 
        />
      </Show>
      
      <Show when={showRenameDialog()}>
        <Dialog
          isOpen={showRenameDialog()}
          onClose={() => {
            if (!isProcessing()) {
              setShowRenameDialog(false);
              setNewName('');
            }
          }}
          title="Rename"
          preventClose={isProcessing()}
          id="rename-dialog"
        >
          <div class="p-6" onClick={(e) => e.stopPropagation()}>
            <div class="mb-4">
              <Input
                value={newName()}
                onInput={(e) => setNewName(e.currentTarget.value)}
                placeholder="Enter new name"
                autofocus
                disabled={isProcessing()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isProcessing()) {
                    handleRename(e);
                  }
                }}
              />
              {props.selectedFile && props.selectedFile.name.includes('.') && !props.selectedFile.isFolder && (
                <div class="text-text-muted text-sm mt-1">
                  Extension will be preserved: {props.selectedFile.name.substring(props.selectedFile.name.lastIndexOf('.'))}
                </div>
              )}
            </div>
            <div class="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isProcessing()) {
                    setShowRenameDialog(false);
                    setNewName('');
                  }
                }}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(e);
                }}
                disabled={isProcessing() || !newName()}
                loading={isProcessing()}
              >
                Rename
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      <Show when={showDuplicateDialog()}>
        <Dialog
          title="Duplicate File"
          isOpen={showDuplicateDialog()}
          onClose={() => setShowDuplicateDialog(false)}
          id="duplicate-dialog"
        >
          <div class="p-6">
            <p class="mb-4">Do you want to create a copy of "{props.selectedFile?.name}"?</p>
            <div class="flex justify-end space-x-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setShowDuplicateDialog(false)}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleDuplicate}
                disabled={isProcessing()}
              >
                {isProcessing() ? 'Duplicating...' : 'Duplicate'}
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      <Show when={showDeleteDialog()}>
        <Dialog
          title="Move to Bin"
          isOpen={showDeleteDialog()}
          onClose={() => setShowDeleteDialog(false)}
        >
          <div class="p-6">
            <div class="flex items-center text-danger mb-4">
              <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-medium">Move "{props.selectedFile?.name}" to Bin?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              You can restore it from the Bin later if needed.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleMoveToTrash}
                disabled={isProcessing()}
              >
                {isProcessing() ? 'Moving to Bin...' : 'Move to Bin'}
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      <Show when={showRestoreDialog()}>
        <Dialog
          title="Restore File"
          isOpen={showRestoreDialog()}
          onClose={() => setShowRestoreDialog(false)}
        >
          <div class="p-4">
            <p class="mb-4">
              Are you sure you want to restore "{props.selectedFile?.name}" to Drive?
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowRestoreDialog(false)}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={isProcessing()}
                loading={isProcessing()}
              >
                Restore
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      <Show when={showDeleteForeverDialog()}>
        <Dialog
          title="Delete Forever"
          isOpen={showDeleteForeverDialog()}
          onClose={() => setShowDeleteForeverDialog(false)}
        >
          <div class="p-4">
            <p class="mb-4">
              Are you sure you want to permanently delete "{props.selectedFile?.name}"? This action cannot be undone.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteForeverDialog(false)}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePermanently}
                disabled={isProcessing()}
                loading={isProcessing()}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
    </>
  );
} 