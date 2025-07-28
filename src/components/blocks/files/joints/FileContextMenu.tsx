import { Component, Show, createSignal, onCleanup, onMount } from 'solid-js';
import { useFileHandler, type FileItem } from '../../../handlers/FileHandler';
import toastService from '../../../common/Notification';

// Import dialogs for Drive page
import DownloadDialog from '../drive/DownloadDialog';
import DuplicateDialog from '../drive/DuplicateDialog';
import RenameDialog from '../drive/RenameDialog';
import MoveToBinDialog from '../drive/MoveToBinDialog';
import FilePreview from '../drive/FilePreview';

// Import dialogs for Bin page
import DeleteForeverDialog from '../bin/DeleteForeverDialog';
import RestoreDialog from '../bin/RestoreDialog';

// Import shared components for both pages
import FileProperties from './FileProperties';

interface FileContextMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  show: boolean;
  onClose: () => void;
  onReload?: () => void;
  isBin?: boolean;
}

const FileContextMenu: Component<FileContextMenuProps> = (props) => {
  const fileHandler = useFileHandler();
  
  // Dialog state
  const [showDownloadDialog, setShowDownloadDialog] = createSignal(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = createSignal(false);
  const [showRenameDialog, setShowRenameDialog] = createSignal(false);
  const [showMoveToBinDialog, setShowMoveToBinDialog] = createSignal(false);
  const [showRestoreDialog, setShowRestoreDialog] = createSignal(false);
  const [showDeleteForeverDialog, setShowDeleteForeverDialog] = createSignal(false);
  const [showPreview, setShowPreview] = createSignal(false);
  const [showProperties, setShowProperties] = createSignal(false);
  
  // Track if any dialog is open
  const isAnyDialogOpen = () => 
    showDownloadDialog() || 
    showDuplicateDialog() || 
    showRenameDialog() || 
    showMoveToBinDialog() || 
    showRestoreDialog() || 
    showDeleteForeverDialog() || 
    showPreview() || 
    showProperties();
  
  // Close the menu when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Not closing if clicking inside a dialog or dialog overlay
    if (target.closest('[role="dialog"]') || target.closest('.dialog-overlay')) {
      return;
    }

    // Not closing if clicking inside the context menu
    if (!target.closest('.context-menu') && !isAnyDialogOpen()) {
      props.onClose();
    }
  };

  // Handle right click outside
  const handleContextMenuOutside = (e: MouseEvent) => {
    e.preventDefault();
    if (!isAnyDialogOpen()) {
    props.onClose();
    }
  };
  
  // Add event listeners when mounted
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenuOutside);
  });
  
  // Clean up event listeners when unmounted
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleContextMenuOutside);
  });
  
  // Determine if file can be previewed
  const canPreview = () => {
    const previewableTypes = [
      'image/', 
      'text/', 
      'application/pdf',
      'video/',
      'audio/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint'
    ];
    return previewableTypes.some(type => props.file.mimeType?.startsWith(type));
  };
  
  // Check if file is in trash bin
  const isInBin = () => {
    return props.isBin === true || props.file.isBin === true;
  };
  
  // Handle file download
  const handleDownload = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDownloadDialog(true);
  };
  
  // Handle file rename
  const handleRename = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowRenameDialog(true);
  };
  
  // Handle file duplicate
  const handleDuplicate = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDuplicateDialog(true);
  };
  
  // Handle move to bin
  const handleMoveToBin = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMoveToBinDialog(true);
  };
  
  // Handle restore from bin
  const handleRestore = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowRestoreDialog(true);
  };
  
  // Handle delete forever
  const handleDeleteForever = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteForeverDialog(true);
  };
  
  // Handle file properties
  const handleProperties = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowProperties(true);
  };
  
  return (
    <>
      <Show when={props.show}>
        <div
          class={`fixed z-40 bg-background rounded-lg shadow-lg border border-background-light overflow-hidden context-menu ${isInBin() ? 'w-44' : 'w-48'}`}
          style={{
            left: `${props.position.x}px`,
            top: `${props.position.y}px`
          }}
        >
          <div class="py-1">
            {/* Options for files in the Bin */}
            <Show when={isInBin()}>
              {/* Restore */}
              <button
                class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
                onClick={handleRestore}
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Restore
              </button>
              
              {/* Delete Forever */}
              <button
                class="w-full px-4 py-2 text-left hover:bg-background-light text-sm text-error"
                onClick={handleDeleteForever}
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Forever
              </button>
              
              {/* Properties */}
              <button
                class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
                onClick={handleProperties}
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Properties
              </button>
            </Show>
            
            {/* Options for files in Drive (not in Bin) */}
            <Show when={!isInBin()}>
              {/* Preview option */}
              <Show when={canPreview()}>
                <button
                  class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowPreview(true);
                }}
                  type="button"
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </Show>
            
            {/* Download */}
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
              onClick={handleDownload}
                type="button"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            
            {/* Rename */}
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
              onClick={handleRename}
                type="button"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            
            {/* Duplicate */}
              <button
                class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
                onClick={handleDuplicate}
                type="button"
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Duplicate
              </button>
            
              {/* Move to bin */}
              <button
                class="w-full px-4 py-2 text-left hover:bg-background-light text-sm text-error"
                onClick={handleMoveToBin}
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Move to Bin
              </button>
            
            {/* Properties */}
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light text-sm"
              onClick={handleProperties}
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Properties
            </button>
            </Show>
          </div>
        </div>
      </Show>

      {/* Dialogs */}
      <Show when={showDownloadDialog()}>
        <DownloadDialog
          isOpen={true}
          files={[props.file]}
          onClose={() => setShowDownloadDialog(false)}
          onComplete={() => {
            props.onReload?.();
            setShowDownloadDialog(false);
          }}
        />
      </Show>

      <Show when={showDuplicateDialog()}>
        <DuplicateDialog
          isOpen={true}
          file={props.file}
          onClose={() => setShowDuplicateDialog(false)}
          onComplete={() => {
            toastService.success('File duplicated successfully');
            props.onReload?.();
            setShowDuplicateDialog(false);
          }}
        />
      </Show>

      <Show when={showRenameDialog()}>
        <RenameDialog
          isOpen={true}
          file={props.file}
          onClose={() => setShowRenameDialog(false)}
          onComplete={() => {
            toastService.success('File renamed successfully');
            props.onReload?.();
            setShowRenameDialog(false);
          }}
        />
      </Show>

      <Show when={showMoveToBinDialog()}>
        <MoveToBinDialog
          isOpen={true}
          files={[props.file]}
          onClose={() => setShowMoveToBinDialog(false)}
          onComplete={() => {
            toastService.success('File moved to bin successfully');
            props.onReload?.();
            setShowMoveToBinDialog(false);
          }}
        />
      </Show>

      <Show when={showRestoreDialog()}>
        <RestoreDialog
          isOpen={true}
          files={[props.file]}
          onClose={() => setShowRestoreDialog(false)}
          onComplete={() => {
            toastService.success('File restored successfully');
            props.onReload?.();
            setShowRestoreDialog(false);
          }}
        />
      </Show>

      <Show when={showDeleteForeverDialog()}>
        <DeleteForeverDialog
          isOpen={true}
          files={[props.file]}
          onClose={() => setShowDeleteForeverDialog(false)}
          onComplete={() => {
            toastService.success('File deleted permanently');
            props.onReload?.();
            setShowDeleteForeverDialog(false);
          }}
        />
      </Show>

      <Show when={showPreview()}>
        <FilePreview
          file={props.file}
          onClose={() => setShowPreview(false)}
          isOpen={true}
        />
      </Show>

      <Show when={showProperties()}>
        <FileProperties
          file={props.file}
          onClose={() => setShowProperties(false)}
        />
      </Show>
    </>
  );
};

export default FileContextMenu;
