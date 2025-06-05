import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { fileGateway } from '../components/gateway/fileGateway';
import { FileItem } from '../components/types/file';
import FileList from '../components/files/FileList';
import Button from '../components/widgets/Button';
import Input from '../components/widgets/Input';
import Dialog from '../components/widgets/Dialog';
import FileContextMenu from '../components/files/FileContextMenu';
import FileProperties from '../components/files/FileProperties';
import FilePreview from '../components/files/FilePreview';
import Spinner from '../components/widgets/Spinner';
import { notificationService } from '../components/common/Notification';

export default function Bin() {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedItems, setSelectedItems] = createSignal<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isSearching, setIsSearching] = createSignal(false);
  
  // Dialog states
  const [showEmptyBinDialog, setShowEmptyBinDialog] = createSignal(false);
  const [showDeleteForeverDialog, setShowDeleteForeverDialog] = createSignal(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = createSignal(false);
  const [showPreviewDialog, setShowPreviewDialog] = createSignal(false);
  const [previewFile, setPreviewFile] = createSignal<FileItem | null>(null);
  const [propertiesFile, setPropertiesFile] = createSignal<FileItem | null>(null);
  const [contextMenuFile, setContextMenuFile] = createSignal<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = createSignal<{ x: number; y: number } | null>(null);
  
  // Context menu
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  
  onMount(() => {
    loadBinFiles();
  });
  
  const loadBinFiles = async () => {
    setIsLoading(true);
    try {
      const items = await fileGateway.getFiles(null, true);
      
      // Separate files and folders
      const folderItems = items.filter(item => item.isFolder);
      const fileItems = items.filter(item => !item.isFolder);
      
      setFolders(folderItems);
      setFiles(fileItems);
      
      // Reset selection
      setSelectedItems([]);
    } catch (error) {
      console.error('Error loading bin files:', error);
      notificationService.error('Failed to load files from bin');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery()) return;
    
    setIsSearching(true);
    try {
      const results = await fileGateway.searchFiles(searchQuery(), true);
      
      // Separate files and folders
      const folderItems = results.filter(item => item.isFolder);
      const fileItems = results.filter(item => !item.isFolder);
      
      setFolders(folderItems);
      setFiles(fileItems);
      
      // Reset selection
      setSelectedItems([]);
    } catch (error) {
      console.error('Error searching files:', error);
      notificationService.error('Failed to search files');
    } finally {
      setIsSearching(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    loadBinFiles();
  };
  
  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file);
  };
  
  const handleFolderClick = (folder: FileItem) => {
    // In bin, clicking on a folder just selects it
    setSelectedItems([folder]);
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
  
  const handleEmptyBin = async () => {
    if (confirm('Are you sure you want to permanently delete all items in the bin? This action cannot be undone.')) {
      try {
        await fileGateway.emptyTrash();
        notificationService.success('Bin emptied successfully');
        loadBinFiles();
      } catch (error) {
        console.error('Error emptying bin:', error);
        notificationService.error('Failed to empty bin');
      }
    }
  };
  
  const handleRestore = async () => {
    try {
      for (const item of selectedItems()) {
        await fileGateway.restoreFromTrash(item.id);
      }
      
      notificationService.success(`${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'} restored`);
      loadBinFiles();
    } catch (error) {
      console.error('Error restoring items:', error);
      notificationService.error('Failed to restore some items');
    }
  };
  
  const handleDeleteForever = async () => {
    if (confirm(`Are you sure you want to permanently delete ${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'}? This action cannot be undone.`)) {
      try {
        for (const item of selectedItems()) {
          await fileGateway.deleteFile(item.id);
        }
        
        notificationService.success(`${selectedItems().length} ${selectedItems().length === 1 ? 'item' : 'items'} permanently deleted`);
        loadBinFiles();
      } catch (error) {
        console.error('Error deleting items:', error);
        notificationService.error('Failed to delete some items');
      }
    }
  };
  
  const handleShowProperties = () => {
    if (selectedItems().length === 1) {
      setPropertiesFile(selectedItems()[0]);
    }
  };
  
  const handleCloseContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };
  
  const handleContextMenuAction = (action: string) => {
    if (!contextMenuFile()) return;
    
    const file = contextMenuFile()!;
    
    switch (action) {
      case 'restore':
        fileGateway.restoreFromTrash(file.id)
          .then(() => {
            notificationService.success(`"${file.name}" restored`);
            loadBinFiles();
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
              loadBinFiles();
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
      case 'properties':
        setPropertiesFile(file);
        break;
    }
    
    handleCloseContextMenu();
  };

  return (
    <div class="p-4 h-full">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-text">
            {isSearching() ? 'Search Results in Bin' : 'Bin'}
          </h1>
          
          <Show when={isSearching()}>
            <button 
              onClick={clearSearch}
              class="text-text-muted hover:text-text ml-2"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Show>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="relative w-64">
            <Input
              type="text"
              placeholder="Search in bin..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text"
              onClick={handleSearch}
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          <Button 
            onClick={() => setShowEmptyBinDialog(true)}
            variant="danger"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Empty Bin
          </Button>
        </div>
      </div>
      
      <div class="bg-background-darker rounded-lg shadow-md overflow-hidden">
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
            onFileProperties={handleShowProperties}
          />
        </Show>
      </div>
      
      {/* Empty Bin Dialog */}
      <Dialog
        isOpen={showEmptyBinDialog()}
        onClose={() => setShowEmptyBinDialog(false)}
        title="Empty Bin"
      >
        <div class="p-4">
          <p class="mb-4 text-text">Are you sure you want to permanently delete all items in the bin?</p>
          
          <div class="flex justify-end gap-2">
            <Button 
              variant="secondary"
              onClick={() => setShowEmptyBinDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleEmptyBin}
            >
              Empty Bin
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* File Preview Dialog */}
      <Dialog
        isOpen={showPreviewDialog()}
        onClose={() => setShowPreviewDialog(false)}
        title={previewFile()?.name || 'Preview'}
        size="xl"
      >
        <Show when={previewFile()}>
          <div class="p-4 flex justify-center">
            <FilePreview file={previewFile()!} size="lg" />
          </div>
        </Show>
      </Dialog>
      
      {/* File Properties Dialog */}
      <Dialog
        isOpen={showPropertiesDialog()}
        onClose={() => setShowPropertiesDialog(false)}
        title="File Properties"
        size="lg"
      >
        <Show when={propertiesFile()}>
          <FileProperties file={propertiesFile()!} />
        </Show>
      </Dialog>
      
      {/* File Context Menu */}
      <Show when={contextMenuPosition() && contextMenuFile()}>
        <FileContextMenu
          position={contextMenuPosition()!}
          file={contextMenuFile()!}
          onClose={handleCloseContextMenu}
          onReload={loadBinFiles}
          onAction={handleContextMenuAction}
          isBin={true}
        />
      </Show>
    </div>
  );
} 