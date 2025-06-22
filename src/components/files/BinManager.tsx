import { createSignal, createEffect, Show, onMount } from 'solid-js';
import { fileGateway } from '../gateway/fileGateway';
import { fileService } from '../services/fileService';
import { FileItem } from '../types/fileType';
import FileList from './FileList';
import FilePreview from './FilePreview';
import FileContextMenu from './FileContextMenu';
import Spinner from '../widgets/Spinner';
import { notificationService } from '../common/Notification';
import Dialog from '../widgets/Dialog';
import Button from '../widgets/Button';

export default function BinManager() {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedItems, setSelectedItems] = createSignal<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  const [previewFile, setPreviewFile] = createSignal<FileItem | null>(null);
  const [contextMenuFile, setContextMenuFile] = createSignal<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = createSignal<{ x: number; y: number } | null>(null);
  const [showEmptyBinDialog, setShowEmptyBinDialog] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);

  onMount(() => {
    loadTrashedItems();
  });

  const loadTrashedItems = async () => {
    setIsLoading(true);
    try {
      const trashedItems = await fileService.getFiles(null, true);
      
      // Separate files and folders
      const folderItems = trashedItems.filter(item => item.isFolder);
      const fileItems = trashedItems.filter(item => !item.isFolder);
      
      setFolders(folderItems);
      setFiles(fileItems);
    } catch (error) {
      console.error('Error loading trashed items:', error);
      notificationService.error('Failed to load trashed items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleFolderClick = (folder: FileItem) => {
    // For bins, just select the folder like a file
    setSelectedFile(folder);
  };

  const handleContextMenu = (item: FileItem, e: MouseEvent) => {
    e.preventDefault();
    setContextMenuFile(item);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSelectItem = (item: FileItem, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // Toggle item in selection
      const isSelected = selectedItems().some(selected => selected.id === item.id);
      
      if (isSelected) {
        setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
    } else {
      // Replace selection
      setSelectedItems([item]);
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const handleEmptyBinClick = () => {
    if (files().length === 0 && folders().length === 0) {
      notificationService.info('Bin is already empty');
      return;
    }
    setShowEmptyBinDialog(true);
  };

  const handleEmptyBin = async () => {
    setIsProcessing(true);
    try {
      await fileService.emptyTrash();
      notificationService.success('Bin emptied successfully');
      setFiles([]);
      setFolders([]);
      setSelectedItems([]);
      setContextMenuFile(null);
      setContextMenuPosition(null);
    } catch (error) {
      console.error('Error emptying bin:', error);
      notificationService.error('Failed to empty bin');
    } finally {
      setIsProcessing(false);
      setShowEmptyBinDialog(false);
    }
  };

  const handleRestoreSelected = async () => {
    try {
      for (const item of selectedItems()) {
        await fileService.restoreFromTrash(item.id, item.name);
      }
      
      notificationService.success(`${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'} restored`);
      
      // Refresh the list
      await loadTrashedItems();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error restoring items:', error);
      notificationService.error('Failed to restore some items');
    }
  };

  const handleRestoreAll = async () => {
    if (files().length === 0 && folders().length === 0) {
      notificationService.info('Bin is already empty');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Use the new service method
      const success = await fileService.restoreAllFromTrash();
      
      if (success) {
        notificationService.success('All items restored successfully');
        // Refresh the list
        await loadTrashedItems();
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error restoring all items:', error);
      notificationService.error('Failed to restore some items');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Are you sure you want to permanently delete ${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'}? This action cannot be undone.`)) {
      try {
        for (const item of selectedItems()) {
          await fileGateway.deleteFile(item.id);
        }
        
        notificationService.success(`${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'} permanently deleted`);
        
        // Refresh the list
        await loadTrashedItems();
        setSelectedItems([]);
      } catch (error) {
        console.error('Error deleting items:', error);
        notificationService.error('Failed to delete some items');
      }
    }
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenuFile()) return;
    
    const file = contextMenuFile()!;
    
    switch (action) {
      case 'restore':
        fileGateway.restoreFromTrash(file.id)
          .then(() => {
            notificationService.success(`"${file.name}" restored`);
            loadTrashedItems();
          })
          .catch((error) => {
            console.error('Error restoring file:', error);
            notificationService.error('Failed to restore file');
          });
        break;
      case 'deleteForever':
        fileGateway.deleteFile(file.id)
          .then(() => {
            notificationService.success(`"${file.name}" permanently deleted`);
            setSelectedItems([]);
            loadTrashedItems();
          })
          .catch((error) => {
            console.error('Error deleting file:', error);
            notificationService.error('Failed to delete file');
          });
        break;
      case 'preview':
        setPreviewFile(file);
        break;
    }
    
    handleCloseContextMenu();
  };

  return (
    <div class="h-full flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-background-light">
        <h1 class="text-2xl font-semibold">Bin</h1>
        <div class="flex items-center space-x-4">
          <Button
            variant="danger"
            onClick={handleEmptyBinClick}
            disabled={isProcessing() || (files().length === 0 && folders().length === 0)}
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Empty Bin
          </Button>
        </div>
      </div>

      <Show when={isLoading()}>
        <div class="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Show>

      <Show when={!isLoading()}>
        <div class="flex-1 overflow-auto">
          <FileList
            files={files()}
            folders={folders()}
            selectedItems={selectedItems()}
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
            onContextMenu={handleContextMenu}
            onSelect={handleSelectItem}
            location="Bin"
          />
        </div>
      </Show>

      <Show when={contextMenuFile() && contextMenuPosition()}>
        <FileContextMenu
          file={contextMenuFile()}
          position={contextMenuPosition()!}
          onClose={handleCloseContextMenu}
          onReload={loadTrashedItems}
          onRestore={(file) => {
            fileGateway.restoreFromTrash(file.id)
              .then(() => {
                notificationService.success(`"${file.name}" restored`);
                loadTrashedItems();
              })
              .catch((error) => {
                console.error('Error restoring file:', error);
                notificationService.error('Failed to restore file');
              });
          }}
          onDeleteForever={(file) => {
            fileGateway.deleteFile(file.id)
              .then(() => {
                notificationService.success(`"${file.name}" permanently deleted`);
                setSelectedItems([]);
                loadTrashedItems();
              })
              .catch((error) => {
                console.error('Error deleting file:', error);
                notificationService.error('Failed to delete file');
              });
          }}
          isBin={true}
        />
      </Show>

      <Show when={showEmptyBinDialog()}>
        <Dialog
          title="Empty Bin"
          isOpen={showEmptyBinDialog()}
          onClose={() => setShowEmptyBinDialog(false)}
        >
          <div class="p-6">
            <p class="text-text mb-4">
              Are you sure you want to empty the bin? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowEmptyBinDialog(false)}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleEmptyBin}
                disabled={isProcessing()}
              >
                {isProcessing() ? (
                  <>
                    <Spinner size="sm" class="mr-2" />
                    Emptying...
                  </>
                ) : (
                  'Empty Bin'
                )}
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
    </div>
  );
} 