import { createSignal, createEffect, onMount, Show, onCleanup } from 'solid-js';
import { fileGateway } from '../components/gateway/fileGateway';
import { fileService } from '../components/services/fileService';
import { FileItem } from '../components/types/fileType';
import FileList from '../components/files/FileList';
import Button from '../components/widgets/Button';
import Input from '../components/widgets/Input';
import Dialog from '../components/widgets/Dialog';
import FileContextMenu from '../components/files/FileContextMenu';
import FileProperties from '../components/files/FileProperties';
import FilePreview from '../components/files/FilePreview';
import Spinner from '../components/widgets/Spinner';
import { notificationService } from '../components/common/Notification';
import StorageUsageBar from '../components/widgets/StorageUsageBar';

export default function Bin() {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
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
  const [isEmptyingBin, setIsEmptyingBin] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [fileToDelete, setFileToDelete] = createSignal<FileItem | null>(null);
  
  // Context menu
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  
  // Add state for the restore all dialog
  const [showRestoreAllDialog, setShowRestoreAllDialog] = createSignal(false);
  const [isRestoringAll, setIsRestoringAll] = createSignal(false);
  
  onMount(() => {
    setIsLoading(true);
    loadFiles().finally(() => setIsLoading(false));
    
    // Add event listener for file refresh events
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Only refresh if it's for the Bin location
      if (detail.location === 'Bin') {
        console.log('Bin: Refreshing files from event', detail);
        loadFiles();
      }
    };
    
    window.addEventListener('files-refreshed', handleRefresh);
    
    onCleanup(() => {
      window.removeEventListener('files-refreshed', handleRefresh);
    });
  });
  
  const loadFiles = async () => {
    try {
      const items = await fileService.getFiles(null, true);
      
      // Separate files and folders
      setFolders(items.filter(item => item.isFolder));
      setFiles(items.filter(item => !item.isFolder));
    } catch (error) {
      console.error('Error loading files:', error);
      notificationService.error('Failed to load files from trash');
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery().trim()) {
      return loadFiles();
    }
    
    try {
      setIsSearching(true);
      setIsLoading(true);
      const results = await fileService.searchFiles(searchQuery(), true);
      
      // Separate files and folders
      setFolders(results.filter(item => item.isFolder));
      setFiles(results.filter(item => !item.isFolder));
    } catch (error) {
      console.error('Error searching files:', error);
      notificationService.error('Failed to search files');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    loadFiles();
  };
  
  const handleEmptyBin = async () => {
    try {
      setIsEmptyingBin(true);
      await fileService.emptyTrash();
      notificationService.success('Bin emptied successfully');
      await loadFiles();
    } catch (error) {
      console.error('Error emptying bin:', error);
      notificationService.error('Failed to empty bin');
    } finally {
      setIsEmptyingBin(false);
      setShowEmptyBinDialog(false);
    }
  };
  
  const handleRestore = async (file: FileItem) => {
    try {
      setIsProcessing(true);
      await fileService.restoreFromTrash(file.id);
      notificationService.success(`"${file.name}" restored successfully`);
      await loadFiles();
    } catch (error) {
      console.error('Error restoring file:', error);
      notificationService.error('Failed to restore file');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteForever = async () => {
    const file = fileToDelete();
    if (!file) return;
    
    try {
      setIsProcessing(true);
      await fileService.deleteFile(file.id, file.name);
      notificationService.success(`"${file.name}" permanently deleted`);
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      notificationService.error('Failed to delete file');
    } finally {
      setIsProcessing(false);
      setShowDeleteForeverDialog(false);
      setFileToDelete(null);
    }
  };
  
  const handleContextMenu = (file: FileItem, e: MouseEvent) => {
    e.preventDefault();
    setContextMenuFile(file);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  const handleCloseContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
    setShowContextMenu(false);
  };
  
  const handleContextMenuAction = (action: string) => {
    if (!contextMenuFile()) return;
    
    const file = contextMenuFile()!;
    
    switch (action) {
      case 'restore':
        handleRestore(file);
        break;
      case 'deleteForever':
        setFileToDelete(file);
        setShowDeleteForeverDialog(true);
        break;
      case 'properties':
        setPropertiesFile(file);
        setShowPropertiesDialog(true);
        break;
    }
    
    handleCloseContextMenu();
  };
  
  // Add a function to handle restoring all files
  const handleRestoreAll = async () => {
    try {
      setIsRestoringAll(true);
      await fileService.restoreAllFromTrash();
      notificationService.success('All items restored successfully');
      await loadFiles();
    } catch (error) {
      console.error('Error restoring all items:', error);
      notificationService.error('Failed to restore all items');
    } finally {
      setIsRestoringAll(false);
      setShowRestoreAllDialog(false);
    }
  };
  
  return (
    <div class="h-full min-h-[calc(100vh-64px)] bg-background flex flex-col">
      {/* Breadcrumb navigation */}
      <div class="bg-background-darkest py-3 px-4 border-b border-background-light sticky top-0 z-10">
        <div class="max-w-6xl mx-auto flex items-center">
          <h1 class="text-2xl font-bold text-text">Bin</h1>
        </div>
      </div>
      
      {/* Main content */}
      <div class="flex-1 flex flex-col">
        <div class="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
          {/* Header with actions */}
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-medium text-text">
                {isSearching() ? 'Search Results' : 'Deleted Items'}
              </h2>
              
              <Show when={isSearching()}>
                <button 
                  onClick={clearSearch}
                  class="text-text-muted hover:text-text ml-2 p-1 rounded-full hover:bg-background-light"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Show>
            </div>
            
            <div class="flex items-center gap-3 w-full md:w-auto">
              <div class="relative flex-1 md:w-64">
                <Input
                  type="text"
                  placeholder="Search in bin..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  fullWidth
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
                variant="primary"
                onClick={() => setShowRestoreAllDialog(true)}
                disabled={isRestoringAll() || (files().length === 0 && folders().length === 0)}
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Restore All
              </Button>
              
              <Button
                variant="danger"
                onClick={() => setShowEmptyBinDialog(true)}
                disabled={isEmptyingBin() || (files().length === 0 && folders().length === 0)}
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Empty Bin
              </Button>
            </div>
          </div>
          
          {/* Files and folders */}
          <div class="bg-background-darker rounded-lg shadow-md overflow-hidden mb-6 flex-1">
            <Show
              when={!isLoading()}
              fallback={
                <div class="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              }
            >
              <Show
                when={files().length > 0 || folders().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-64 text-text-muted">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p class="text-xl">Bin is empty</p>
                    <p class="text-sm mt-2">Items you delete will appear here</p>
                  </div>
                }
              >
                <FileList
                  files={files()}
                  folders={folders()}
                  isLoading={isLoading()}
                  currentPath="/bin"
                  onFileClick={(file) => {
                    setPreviewFile(file);
                    setShowPreviewDialog(true);
                  }}
                  onFolderClick={() => {}}
                  onFileDelete={() => {}}
                  onFileRename={() => {}}
                  onFileDownload={() => {}}
                  onFileProperties={(file) => {
                    setPropertiesFile(file);
                    setShowPropertiesDialog(true);
                  }}
                  onFileRestore={handleRestore}
                  onFileDeleteForever={(file) => {
                    setFileToDelete(file);
                    setShowDeleteForeverDialog(true);
                  }}
                  onContextMenu={handleContextMenu}
                  isBin={true}
                />
              </Show>
            </Show>
          </div>
          
          {/* Storage usage */}
          <div class="mb-6">
            <StorageUsageBar />
          </div>
        </div>
      </div>
      
      {/* Context Menu - Bin specific context menu */}
      <Show when={showContextMenu() && contextMenuFile() && contextMenuPosition()}>
        <FileContextMenu
          file={contextMenuFile()}
          position={contextMenuPosition()!}
          onClose={handleCloseContextMenu}
          onReload={loadFiles}
          onRestore={(file) => {
            handleRestore(file);
          }}
          onDeleteForever={(file) => {
            setFileToDelete(file);
            setShowDeleteForeverDialog(true);
          }}
          onViewDetails={(file) => {
            setPropertiesFile(file);
            setShowPropertiesDialog(true);
          }}
          isBin={true}
        />
      </Show>
      
      {/* Properties Dialog */}
      <Show when={showPropertiesDialog() && propertiesFile()}>
        <FileProperties
          file={propertiesFile()!}
          onClose={() => setShowPropertiesDialog(false)}
        />
      </Show>
      
      {/* Preview Dialog */}
      <Show when={showPreviewDialog() && previewFile()}>
        <FilePreview
          file={previewFile()!}
          getPreviewData={(fileId) => fileService.getFilePreview(fileId)}
          onClose={() => setShowPreviewDialog(false)}
        />
      </Show>
      
      {/* Empty Bin Confirmation Dialog */}
      <Show when={showEmptyBinDialog()}>
        <Dialog
          title="Empty Bin"
          isOpen={showEmptyBinDialog()}
          onClose={() => setShowEmptyBinDialog(false)}
        >
          <div class="p-6">
            <div class="flex items-center text-danger mb-4">
              <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-medium">Are you sure you want to empty the bin?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              All items in the bin will be permanently deleted. This action cannot be undone.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowEmptyBinDialog(false)}
                disabled={isEmptyingBin()}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleEmptyBin}
                disabled={isEmptyingBin()}
              >
                {isEmptyingBin() ? (
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
      
      {/* Delete Forever Confirmation Dialog */}
      <Show when={showDeleteForeverDialog() && fileToDelete()}>
        <Dialog
          title="Delete Forever"
          isOpen={showDeleteForeverDialog()}
          onClose={() => {
            setShowDeleteForeverDialog(false);
            setFileToDelete(null);
          }}
        >
          <div class="p-6">
            <div class="flex items-center text-danger mb-4">
              <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 class="text-lg font-medium">Delete "{fileToDelete()?.name}" forever?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              This action cannot be undone. The item will be permanently deleted.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDeleteForeverDialog(false);
                  setFileToDelete(null);
                }}
                disabled={isProcessing()}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteForever}
                disabled={isProcessing()}
              >
                {isProcessing() ? (
                  <>
                    <Spinner size="sm" class="mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      {/* Restore All Confirmation Dialog */}
      <Show when={showRestoreAllDialog()}>
        <Dialog
          title="Restore All Items"
          isOpen={showRestoreAllDialog()}
          onClose={() => setShowRestoreAllDialog(false)}
        >
          <div class="p-6">
            <div class="flex items-center text-primary mb-4">
              <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <h3 class="text-lg font-medium">Restore all items?</h3>
            </div>
            
            <p class="text-text-muted mb-6">
              All items in the bin will be restored to their original locations in Drive.
            </p>
            
            <div class="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowRestoreAllDialog(false)}
                disabled={isRestoringAll()}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleRestoreAll}
                disabled={isRestoringAll()}
              >
                {isRestoringAll() ? (
                  <>
                    <Spinner size="sm" class="mr-2" />
                    Restoring...
                  </>
                ) : (
                  'Restore All'
                )}
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
    </div>
  );
} 