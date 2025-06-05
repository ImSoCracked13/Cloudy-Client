import { createSignal, createEffect, Show, onMount } from 'solid-js';
import { fileGateway } from '../gateway/fileGateway';
import { fileService } from '../services/fileService';
import { FileItem } from '../types/file';
import FileList from './FileList';
import FilePreview from './FilePreview';
import FileContextMenu from './FileContextMenu';
import Spinner from '../widgets/Spinner';
import { notificationService } from '../common/Notification';

export default function BinManager() {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedItems, setSelectedItems] = createSignal<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  const [previewFile, setPreviewFile] = createSignal<FileItem | null>(null);
  const [contextMenuFile, setContextMenuFile] = createSignal<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = createSignal<{ x: number; y: number } | null>(null);

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

  const handleEmptyBin = async () => {
    if (confirm('Are you sure you want to permanently delete all items in the bin? This action cannot be undone.')) {
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
      }
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
      case 'delete':
        if (confirm(`Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`)) {
          fileGateway.deleteFile(file.id)
            .then(() => {
              notificationService.success(`"${file.name}" permanently deleted`);
              loadTrashedItems();
            })
            .catch((error) => {
              console.error('Error deleting file:', error);
              notificationService.error('Failed to delete file');
            });
        }
        break;
      case 'preview':
        setPreviewFile(file);
        break;
    }
    
    handleCloseContextMenu();
  };

  return (
    <div class="p-4 h-full">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-text">Bin</h1>
        
        <div class="flex space-x-3">
          <button 
            onClick={handleRestoreSelected}
            disabled={selectedItems().length === 0}
            class="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Restore
          </button>
          
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedItems().length === 0}
            class="flex items-center gap-2 px-3 py-1.5 bg-danger hover:bg-danger-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Forever
          </button>
          
          <button 
            onClick={handleEmptyBin}
            class="flex items-center gap-2 px-3 py-1.5 bg-background-light hover:bg-background text-text-muted hover:text-text rounded"
          >
            Empty Bin
          </button>
        </div>
      </div>
      
      <Show when={!isLoading()} fallback={<div class="flex justify-center py-10"><Spinner size="lg" /></div>}>
        <FileList 
          files={files()}
          folders={folders()}
          isLoading={isLoading()}
          currentPath="/bin"
          onFileClick={handleFileClick}
          onFolderClick={handleFolderClick}
          onFileDelete={() => {}}
          onFileRename={() => {}}
          onFileDownload={() => {}}
          onFileProperties={() => {}}
        />
      </Show>
      
      {/* File Context Menu */}
      <Show when={contextMenuPosition() && contextMenuFile()}>
        <FileContextMenu
          position={contextMenuPosition()!}
          file={contextMenuFile()!}
          onClose={handleCloseContextMenu}
          onReload={loadTrashedItems}
          onAction={handleContextMenuAction}
          isBin={true}
        />
      </Show>
      
      {/* File Preview */}
      <Show when={previewFile()}>
        <FilePreview
          file={previewFile()!}
          onClose={handleClosePreview}
          isOpen={!!previewFile()}
        />
      </Show>
    </div>
  );
} 