import { createSignal, Show, onCleanup, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { FileItem } from '../types/fileType';
import { fileService } from '../services/fileService';
import { notificationService } from '../common/Notification';
import Dialog from '../widgets/Dialog';
import Input from '../widgets/Input';
import Button from '../widgets/Button';

interface FileContextMenuProps {
  file: FileItem | null;
  position: { x: number; y: number };
  onClose: () => void;
  onReload: () => void;
  onViewDetails?: (file: FileItem) => void;
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (newName: string) => void;
  onDuplicate?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onDeleteForever?: (file: FileItem) => void;
  onAction?: (action: string, file: FileItem) => void;
  isBin?: boolean;
}

export default function FileContextMenu(props: FileContextMenuProps) {
  let menuRef: HTMLDivElement | undefined;
  const [menuPosition, setMenuPosition] = createSignal(adjustPosition(props.position));
  const [showRenameDialog, setShowRenameDialog] = createSignal(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = createSignal(false);
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [showDeleteForeverDialog, setShowDeleteForeverDialog] = createSignal(false);
  const [showRestoreDialog, setShowRestoreDialog] = createSignal(false);
  const [newName, setNewName] = createSignal('');
  const [duplicateName, setDuplicateName] = createSignal('');
  
  // Adjust menu position to ensure it's fully visible
  function adjustPosition(pos: { x: number; y: number }) {
    const x = pos.x;
    const y = pos.y;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 220; // approximate menu width
    const menuHeight = props.isBin ? 150 : 350; // approximate menu height
    
    // Adjust position if near screen edges
    const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : x;
    const adjustedY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : y;
    
    return { x: adjustedX, y: adjustedY };
  }
  
  // Handle click outside to close menu
  function handleClickOutside(e: MouseEvent) {
    // Don't close if a dialog is open
    if (showRenameDialog() || showDuplicateDialog() || showDeleteDialog() || 
        showDeleteForeverDialog() || showRestoreDialog()) {
      return;
    }
    
    if (menuRef && !menuRef.contains(e.target as Node)) {
      props.onClose();
    }
  }
  
  // Handle keyboard events
  function handleKeyDown(e: KeyboardEvent) {
    // Don't close if a dialog is open
    if (showRenameDialog() || showDuplicateDialog() || showDeleteDialog() || 
        showDeleteForeverDialog() || showRestoreDialog()) {
      return;
    }
    
    if (e.key === 'Escape') {
      props.onClose();
    }
  }
  
  onMount(() => {
    // Add event listeners with a small delay to prevent immediate triggering
    setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    }, 10);
    
    // Adjust position once menu is rendered
    if (menuRef) {
      const rect = menuRef.getBoundingClientRect();
      setMenuPosition(adjustPosition({
        x: props.position.x,
        y: props.position.y
      }));
    }
  });
  
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  const handleAction = async (action: string, e: MouseEvent) => {
    if (!props.file) return;
    
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    try {
      switch (action) {
        case 'preview':
          props.onPreview?.(props.file);
          break;
          
        case 'download':
          const success = await fileService.downloadAndSaveFile(props.file.id, props.file.name, props.file.isFolder);
          if (!success) {
            throw new Error('Failed to download file');
          }
          break;
          
        case 'rename':
          handleRename();
          break;
          
        case 'duplicate':
          handleDuplicate();
          break;
          
        case 'move':
          handleMove();
          break;
          
        case 'delete':
          handleDelete();
          break;
          
        case 'deleteForever':
          handleDeleteForever();
          break;
          
        case 'restore':
          if (props.onRestore) {
            await props.onRestore(props.file);
          }
          break;
          
        case 'properties':
          props.onViewDetails?.(props.file);
          break;
          
        default:
          console.warn('Unknown action:', action);
      }
      
      // Close the context menu after action
      props.onClose();
    } catch (error) {
      console.error('Error handling action:', action, error);
      notificationService.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };
  
  // Handle rename action
  const handleRename = () => {
    if (!props.file) return;
    
    // Separate filename from extension
    const fullName = props.file.name;
    const hasExtension = fullName.includes('.') && !props.file.isFolder && !fullName.startsWith('.');
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

  // Handle duplicate action
  const handleDuplicate = () => {
    if (!props.file) return;
    
    // Show a confirmation dialog
    setShowDuplicateDialog(true);
  };

  // Handle delete action
  const handleDelete = () => {
    if (!props.file) return;
    setShowDeleteDialog(true);
  };
  
  // Handle delete forever action
  const handleDeleteForever = async () => {
    if (!props.file) return;
    
    if (props.onDeleteForever) {
      await props.onDeleteForever(props.file);
    }
  };
  
  // Handle restore action
  const handleRestore = () => {
    if (props.onRestore && props.file) {
      props.onRestore(props.file);
    }
  };
  
  return (
    <Portal>
      <div
        ref={menuRef}
        class="fixed z-[1000] bg-background-darker shadow-lg rounded-md overflow-hidden border border-background-light min-w-[200px]"
        style={{
          left: `${menuPosition().x}px`,
          top: `${menuPosition().y}px`,
          "pointer-events": "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="py-1">
          <Show when={!props.isBin}>
            {/* Drive Context Menu - 6 options: Preview, Download, Rename, Duplicate, Delete, Properties */}
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={(e) => handleAction('preview', e)}
              disabled={!props.onPreview}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={(e) => handleAction('download', e)}
              disabled={!props.onDownload}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={handleRename}
              disabled={!props.onRename}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={handleDuplicate}
              disabled={!props.onDuplicate}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Duplicate
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-danger cursor-pointer"
              onClick={handleDelete}
              disabled={!props.onDelete}
            >
              <svg class="w-5 h-5 text-danger-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Move to Bin
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={(e) => handleAction('properties', e)}
              disabled={!props.onViewDetails}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Properties
            </button>
          </Show>
          
          <Show when={props.isBin}>
            {/* Bin Context Menu - 2 options: Restore, Delete Forever */}
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text cursor-pointer"
              onClick={(e) => handleAction('restore', e)}
              disabled={!props.onRestore}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Restore
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-danger cursor-pointer"
              onClick={(e) => handleAction('deleteForever', e)}
              disabled={!props.onDeleteForever}
            >
              <svg class="w-5 h-5 text-danger-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Forever
            </button>
          </Show>
        </div>
      </div>

      {/* Rename Dialog */}
      <Show when={showRenameDialog()}>
        <Dialog
          title="Rename File"
          isOpen={showRenameDialog()}
          onClose={() => setShowRenameDialog(false)}
          id="rename-dialog"
        >
          <div class="p-6">
            <Input
              label="New Name"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
              placeholder="Enter new name"
              autofocus
            />
            {props.file && props.file.name.includes('.') && !props.file.isFolder && (
              <div class="text-text-muted text-sm mt-1">
                Extension will be preserved: {props.file.name.substring(props.file.name.lastIndexOf('.'))}
              </div>
            )}
            <div class="flex justify-end space-x-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setShowRenameDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (props.onRename) {
                    // Get extension from data attribute
                    const renameDialog = document.getElementById('rename-dialog');
                    const extension = renameDialog?.dataset.extension || '';
                    
                    // Combine new name with extension
                    const fullNewName = newName() + extension;
                    props.onRename(fullNewName);
                  }
                  setShowRenameDialog(false);
                }}
                disabled={!newName() || newName() === (props.file?.name.includes('.') ? props.file.name.substring(0, props.file.name.lastIndexOf('.')) : props.file?.name)}
              >
                Rename
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>

      {/* Duplicate Dialog */}
      <Show when={showDuplicateDialog()}>
        <Dialog
          title="Duplicate File"
          isOpen={showDuplicateDialog()}
          onClose={() => setShowDuplicateDialog(false)}
          id="duplicate-dialog"
        >
          <div class="p-6">
            <p class="mb-4">Do you want to create a copy of "{props.file?.name}"?</p>
            <div class="flex justify-end space-x-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setShowDuplicateDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (props.onDuplicate && props.file) {
                    props.onDuplicate(props.file);
                  }
                  setShowDuplicateDialog(false);
                }}
              >
                Duplicate
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>

      {/* Delete Confirmation Dialog */}
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
              <h3 class="text-lg font-medium">Move "{props.file?.name}" to Bin?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              You can restore it from the Bin later if needed.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  if (props.onDelete && props.file) {
                    props.onDelete(props.file);
                  }
                  setShowDeleteDialog(false);
                }}
              >
                Move to Bin
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>

      {/* Delete Forever Dialog */}
      <Show when={showDeleteForeverDialog()}>
        <Dialog
          title="Delete Forever"
          isOpen={showDeleteForeverDialog()}
          onClose={() => setShowDeleteForeverDialog(false)}
        >
          <div class="p-6">
            <p class="text-text mb-4">
              Are you sure you want to permanently delete "{props.file?.name}"? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteForeverDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={async () => {
                  try {
                    if (props.onAction) {
                      await props.onAction('deleteForever', props.file!);
                    } else if (props.onDeleteForever) {
                      await props.onDeleteForever(props.file!);
                    }
                    setShowDeleteForeverDialog(false);
                    props.onClose();
                  } catch (error) {
                    console.error('Error deleting file forever:', error);
                    notificationService.error('Failed to delete file');
                  }
                }}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>

      {/* Restore Confirmation Dialog */}
      <Show when={showRestoreDialog()}>
        <Dialog
          title="Restore File"
          isOpen={showRestoreDialog()}
          onClose={() => setShowRestoreDialog(false)}
        >
          <div class="p-6">
            <div class="flex items-center text-primary mb-4">
              <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <h3 class="text-lg font-medium">Restore "{props.file?.name}"?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              This file will be restored to your Drive.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowRestoreDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (props.onRestore && props.file) {
                    props.onRestore(props.file);
                  }
                  setShowRestoreDialog(false);
                }}
              >
                Restore
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
    </Portal>
  );
} 