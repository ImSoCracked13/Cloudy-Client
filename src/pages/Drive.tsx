import { createSignal, createEffect, onMount, Show, For, onCleanup } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { FileItem } from '../components/types/fileType';
import FileList from '../components/files/FileList';
import Button from '../components/widgets/Button';
import Input from '../components/widgets/Input';
import Dialog from '../components/widgets/Dialog';
import Breadcrumb from '../components/widgets/Breadcrumb';
import FileContextMenu from '../components/files/FileContextMenu';
import FileProperties from '../components/files/FileProperties';
import FilePreview from '../components/files/FilePreview';
import StorageUsageBar from '../components/widgets/StorageUsageBar';
import { useFileUpload } from '../components/hooks/useFileUpload';
import { useDragDrop } from '../components/hooks/useDragDrop';
import { fileService } from '../components/services/fileService';
import { notificationService } from '../components/common/Notification';
import Spinner from '../components/widgets/Spinner';
import UploadBar from '../components/files/UploadBar';
import DuplicateDialog, { DuplicateAction } from '../components/files/DetectingDialog';

export default function Drive() {
  const params = useParams();
  
  const [currentFolder, setCurrentFolder] = createSignal<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = createSignal<{ id: string; label: string }[]>([{ id: 'root', label: 'My Drive' }]);
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedItems, setSelectedItems] = createSignal<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isSearching, setIsSearching] = createSignal(false);
  const [showUploadProgress, setShowUploadProgress] = createSignal(false);
  
  // Dialog states
  const [showCreateFolderDialog, setShowCreateFolderDialog] = createSignal(false);
  const [showRenameDialog, setShowRenameDialog] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal('');
  const [newFileName, setNewFileName] = createSignal('');
  const [fileToRename, setFileToRename] = createSignal<FileItem | null>(null);
  const [showPropertiesDialog, setShowPropertiesDialog] = createSignal(false);
  const [showPreviewDialog, setShowPreviewDialog] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = createSignal(false);
  const [isRenaming, setIsRenaming] = createSignal(false);
  
  // Context menu
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  const [contextMenuPosition, setContextMenuPosition] = createSignal({ x: 0, y: 0 });
  
  // File upload
  const {
    uploadFiles,
    isUploading,
    uploadProgress,
    clearUploadProgress,
    getAverageUploadProgress
  } = useFileUpload();
  
  // Overwrite confirmation state (fallback implementation)
  const [showConfirmOverwrite, setShowConfirmOverwrite] = createSignal(false);
  const [pendingUploadFiles, setPendingUploadFiles] = createSignal<File[]>([]);
  
  // Drag and drop
  const { isDragging, bindDragEvents } = useDragDrop({
    onDrop: (files) => handleFileDrop(files)
  });

  const dragRef = (el: HTMLDivElement) => {
    // Apply all drag event handlers to the element
    el.ondragenter = bindDragEvents.onDragEnter;
    el.ondragover = bindDragEvents.onDragOver;
    el.ondragleave = bindDragEvents.onDragLeave;
    el.ondrop = bindDragEvents.onDrop;
  };
  
  // Add this to the state declarations
  const [showSizeWarningDialog, setShowSizeWarningDialog] = createSignal(false);
  const [dialogType, setDialogType] = createSignal<'overwrite' | 'size-warning'>('overwrite');
  
  // Add state for the duplicate file names
  const [existingFileNames, setExistingFileNames] = createSignal<string[]>([]);
  
  // Create folder handling
  const handleCreateFolder = async () => {
    if (!newFolderName()) return;
    
    // Check if folder with this name already exists
    try {
      const existingFiles = await fileService.getFiles(currentFolder() || null, false);
      const existingFolder = existingFiles.find(
        file => file.isFolder && file.name.toLowerCase() === newFolderName().toLowerCase()
      );
      
      if (existingFolder) {
        // Show duplicate folder dialog
        setDuplicateFolderName(newFolderName());
        setShowDuplicateFolderDialog(true);
        return;
      }
      
      // No duplicate, proceed with folder creation
      await createFolder(newFolderName(), false);
    } catch (error) {
      console.error('Error checking for existing folders:', error);
      notificationService.error('Failed to check for existing folders');
    }
  };
  
  // Function to create a folder with overwrite option
  const createFolder = async (folderName: string, overwrite: boolean = false) => {
    setIsCreatingFolder(true);
    try {
      const folder = await fileService.createFolder(folderName, currentFolder() || '/', overwrite);
      
      console.log('Created folder response:', folder);
      
      if (folder) {
        // Dispatch a refresh event to update the Drive file list
        const refreshEvent = new CustomEvent('files-refreshed', { 
          detail: { location: 'Drive' } 
        });
        window.dispatchEvent(refreshEvent);
        
        // Reload files to show the newly created folder
        await loadFiles();
        setShowCreateFolderDialog(false);
        setShowDuplicateFolderDialog(false);
        setNewFolderName('');
        notificationService.success(`Folder "${folderName}" created successfully`);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      notificationService.error('Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };
  
  // Handle duplicate folder options
  const handleKeepBoth = async () => {
    // Generate a unique name (add a number)
    let uniqueName = duplicateFolderName();
    let counter = 1;
    
    const existingFiles = await fileService.getFiles(currentFolder() || null, false);
    
    // Keep incrementing counter until we find a unique name
    while (existingFiles.some(file => file.name.toLowerCase() === `${uniqueName} (${counter})`.toLowerCase())) {
      counter++;
    }
    
    // Create folder with unique name
    await createFolder(`${uniqueName} (${counter})`, false);
  };
  
  const handleOverwrite = async () => {
    // Create folder with overwrite flag
    await createFolder(duplicateFolderName(), true);
  };
  
  // Add new state variables
  const [showDuplicateFolderDialog, setShowDuplicateFolderDialog] = createSignal(false);
  const [duplicateFolderName, setDuplicateFolderName] = createSignal('');
  
  // Load files when the component mounts or path changes
  createEffect(() => {
    setIsLoading(true);
    setShowUploadProgress(false);
    loadFiles().finally(() => setIsLoading(false));
  });
  
  // Add event listener for the 'files-refreshed' event
  onMount(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Only refresh if it's for the Drive location
      if (detail.location === 'Drive') {
        console.log('Drive: Refreshing files from event', detail);
        loadFiles();
      }
    };
    
    window.addEventListener('files-refreshed', handleRefresh);
    
    onCleanup(() => {
      window.removeEventListener('files-refreshed', handleRefresh);
    });
  });
  
  // Load files from the server
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const items = await fileService.getFiles(currentFolder() || null, false);
      
      // Check if items is an array
      if (!items || !Array.isArray(items)) {
        console.warn('Received invalid data format from server:', items);
        // Set empty arrays for files and folders
        setFolders([]);
        setFiles([]);
        return;
      }
      
      console.log('Loaded items:', items);
      
      // Separate files and folders
      const folderItems = items.filter(item => item && item.isFolder === true);
      const fileItems = items.filter(item => item && item.isFolder === false);
      
      console.log('Folders:', folderItems);
      console.log('Files:', fileItems);
      
      setFolders(folderItems);
      setFiles(fileItems);
      
      // Clear selected items when changing folders
      setSelectedItems([]);
    } catch (error) {
      console.error('Error loading files:', error);
      notificationService.error('Failed to load files');
      // Set empty arrays on error
      setFolders([]);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery()) return;
    
    setIsSearching(true);
    setIsLoading(true);
    
    try {
      const results = await fileService.searchFiles(searchQuery(), false);
      
      // Check if results is an array
      if (!results || !Array.isArray(results)) {
        console.warn('Received invalid search results format from server:', results);
        // Set empty arrays for files and folders
        setFolders([]);
        setFiles([]);
        return;
      }
      
      // Separate files and folders
      setFolders(results.filter(item => item && item.isFolder) || []);
      setFiles(results.filter(item => item && !item.isFolder) || []);
      
      // Clear selected items when searching
      setSelectedItems([]);
    } catch (error) {
      console.error('Error searching files:', error);
      // Set empty arrays on error
      setFolders([]);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadFiles();
  };
  
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreviewDialog(true);
  };
  
  const handleFolderClick = (folder: FileItem) => {
    // Navigate to folder by updating currentFolder and loading its contents
    setCurrentFolder(folder.id);
    loadFiles();
    updateBreadcrumb(folder.id);
    
    // Update URL without page reload
    window.history.pushState({}, '', `/drive/${folder.id}`);
  };
  
  const handleContextMenu = (item: FileItem, e: MouseEvent) => {
    // Show context menu
    e.preventDefault();
    setSelectedFile(item);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  const handleSelectItem = (item: FileItem, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      // Add or remove item from selection
      const isSelected = selectedItems().some(i => i.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems().filter(i => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems(), item]);
      }
    } else {
      // Replace selection with just this item
      setSelectedItems([item]);
    }
  };
  
  const handleFileDrop = async (droppedFiles: File[]) => {
    if (droppedFiles.length === 0) return;
    
    try {
      // Store files for potential overwrite confirmation
      setPendingUploadFiles(droppedFiles);
      
      // Check for large files first
      const largeFiles = droppedFiles.filter(file => file.size > 50 * 1024 * 1024); // 50MB
      if (largeFiles.length > 0) {
        setDialogType('size-warning');
        setShowSizeWarningDialog(true);
        return;
      }
      
      // Check if any files would overwrite existing ones
      const existingFiles = await fileService.checkExistingFiles(
        droppedFiles.map(f => f.name), 
        currentFolder() || null
      );
      
      if (existingFiles.length > 0) {
        // Show confirmation dialog
        setDialogType('overwrite');
        setShowConfirmOverwrite(true);
        return; // Wait for confirmation
      }
      
      // No conflicts, proceed with upload
      await uploadFiles(droppedFiles, currentFolder() || null);
      
        // Reload files to show the newly uploaded files
        await loadFiles();
    } catch (error) {
      console.error('Error uploading dropped files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload files');
    }
  };
  
  // Update the handleFileUpload function to use the new dialog
  const handleFileUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    
    try {
      // Check for large files first
      const largeFiles = files.filter(file => file.size > 50 * 1024 * 1024); // 50MB
      if (largeFiles.length > 0) {
        setPendingUploadFiles(files);
        setDialogType('size-warning');
        setShowSizeWarningDialog(true);
        return;
      }
      
      // Check if any files would overwrite existing ones
      const existingFiles = await fileService.checkExistingFiles(
        files.map(f => f.name), 
        currentFolder() || null
      );
      
      if (existingFiles.length > 0) {
        setPendingUploadFiles(files);
        setExistingFileNames(existingFiles);
        setShowConfirmOverwrite(true);
        return; // Wait for confirmation
      }
      
      // No conflicts, proceed with upload
      await uploadFiles(files, currentFolder() || null);
      
        // Reload files to show the newly uploaded files
        await loadFiles();
      
      // Reset the input
      input.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload files');
      // Reset the input
      input.value = '';
    }
  };
  
  // Update the confirmOverwrite function to handle the action from the dialog
  const confirmOverwrite = async (action: DuplicateAction = 'overwrite') => {
    setShowConfirmOverwrite(false);
    const files = pendingUploadFiles();
    
    if (!files.length) return;
    
    try {
      switch (action) {
        case 'overwrite':
          // Upload with overwrite flag
          await uploadFiles(files, currentFolder() || null, true);
          break;
          
        case 'keep-both':
          // Upload without overwrite flag (will auto-rename)
          await uploadFiles(files, currentFolder() || null, false);
          break;
          
        case 'cancel':
          // Do nothing
          break;
      }
      
      // Reload files to show the newly uploaded files
      await loadFiles();
      
      // Reset the input
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      console.error('Error handling file upload:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setPendingUploadFiles([]);
    }
  };
  
  const handlePreview = () => {
    if (selectedFile()) {
      setShowPreviewDialog(true);
    }
  };
  
  const handleDownload = async () => {
    if (!selectedFile()) return;
    
    try {
      let blob;
      if (selectedFile()!.isFolder) {
        blob = await fileService.downloadFolder(selectedFile()!.id, selectedFile()!.name);
      } else {
        blob = await fileService.downloadFile(selectedFile()!.id, selectedFile()!.name);
      }
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile()!.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  const handleFileRename = async (file: FileItem, newName: string): Promise<void> => {
    if (!newName || newName === file.name) return;
    
    try {
      await fileService.renameFile(file.id, file.name, newName);
      await loadFiles();
    } catch (error) {
      console.error('Error renaming file:', error);
      notificationService.error('Failed to rename file');
    }
  };
  
  const handleDuplicate = async () => {
    if (!selectedFile()) return;
    
    try {
      await fileService.duplicateFile(selectedFile()!.id, selectedFile()!.name);
      loadFiles();
    } catch (error) {
      console.error('Error duplicating file:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedFile()) return;
    
    try {
      await fileService.moveToTrash(selectedFile()!.id);
      notificationService.success(`"${selectedFile()!.name}" moved to trash`);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      notificationService.error('Failed to move file to trash');
    }
  };
  
  const handleShowProperties = () => {
    if (selectedFile()) {
      setShowPropertiesDialog(true);
    }
  };

  // Calculate upload progress
  const getUploadProgress = () => {
    return getAverageUploadProgress ? getAverageUploadProgress() : 0;
  };

  // Update the rename handler for context menu
  const handleRenameFromContextMenu = (newName: string) => {
    if (selectedFile() && newName) {
      handleFileRename(selectedFile()!, newName);
    }
  };

  const updateBreadcrumb = async (folderId?: string) => {
    if (!folderId) {
      setCurrentPath([{ id: 'root', label: 'My Drive' }]);
      return;
    }
    
    try {
      // This would need to be implemented in the backend to get the full path
      // For now, return a mock path
      setCurrentPath([
        { id: 'root', label: 'My Drive' },
        { id: folderId, label: 'Folder' }
      ]);
    } catch (error) {
      console.error('Error loading path:', error);
    }
  };

  const handleMoveToTrash = async () => {
    try {
      if (!selectedFile()) return;
      
      setIsProcessing(true);
      await fileService.moveToTrash(selectedFile()!.id);
      notificationService.success(`"${selectedFile()!.name}" moved to trash`);
      await loadFiles();
    } catch (error) {
      console.error('Error moving file to trash:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to move file to trash');
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmSizeWarning = async () => {
    setShowSizeWarningDialog(false);
    const files = pendingUploadFiles();
    
    if (!files.length) return;
    
    try {
      // Proceed with upload
      await uploadFiles(files, currentFolder() || null);
      
      // Reload files to show the newly uploaded files
      await loadFiles();
      
      // Reset the input
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      notificationService.error(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setPendingUploadFiles([]);
    }
  };

  const cancelSizeWarning = () => {
    setShowSizeWarningDialog(false);
    setPendingUploadFiles([]);
  };

  const cancelOverwrite = () => {
    setShowConfirmOverwrite(false);
    setPendingUploadFiles([]);
  };

  return (
    <div 
      class="h-full min-h-[calc(100vh-64px)] bg-background flex flex-col"
      ref={dragRef}
    >
      {/* Drag overlay */}
      <div class={`
        fixed inset-0 bg-background-darkest/80 z-50 flex items-center justify-center
        transition-opacity duration-200 pointer-events-none backdrop-blur-sm
        ${isDragging() ? 'opacity-100' : 'opacity-0'}
      `}>
        <div class="bg-background-darker p-8 rounded-lg shadow-lg text-center border border-primary/20">
          <svg class="h-20 w-20 text-primary mx-auto mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <h3 class="text-2xl font-medium text-text mb-2">Drop files to upload</h3>
          <p class="text-text-muted">Files will be uploaded to the current folder</p>
        </div>
      </div>
      
      {/* Breadcrumb navigation */}
      <div class="bg-background-darkest py-3 px-4 border-b border-background-light sticky top-0 z-10">
        <div class="max-w-6xl mx-auto flex items-center">
          <Breadcrumb 
            items={currentPath()}
            onNavigate={(id) => {
              if (id === 'root') {
                window.location.href = '/drive';
              } else {
                window.location.href = `/drive/${id}`;
              }
            }}
          />
        </div>
      </div>
      
      {/* Main content */}
      <div class="flex-1 flex flex-col">
        <div class="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
          {/* Header with actions */}
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-text">
                {isSearching() ? 'Search Results' : 'My Drive'}
              </h1>
              
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
                  placeholder="Search files..."
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
              
              <div class="flex gap-2">
                <Button 
                  onClick={() => setShowCreateFolderDialog(true)}
                  variant="secondary"
                  size="md"
                >
                  <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Create Folder
                </Button>
                
                <label class="cursor-pointer">
                  <input 
                    type="file" 
                    id="file-upload"
                    class="hidden" 
                    multiple 
                    onChange={handleFileUpload}
                  />
                  <Button 
                    size="md"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </Button>
                </label>
              </div>
            </div>
          </div>
          
          {/* Upload progress */}
          <Show when={isUploading()}>
            <div class="mb-6">
              <div class="bg-background-darker p-4 rounded-md border border-primary/10">
                <div class="flex justify-between items-center mb-2">
                  <div class="flex items-center">
                    <svg class="h-5 w-5 text-primary mr-2 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <h3 class="font-medium text-text">Uploading files...</h3>
                  </div>
                  <span class="text-sm font-medium text-primary">{getUploadProgress()}%</span>
                </div>
                <div class="w-full bg-background-light rounded-full h-2.5">
                  <div 
                    class="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${getUploadProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Show>
          
          {/* Files and folders */}
          <div class="bg-background-darker rounded-lg shadow-md overflow-hidden mb-6 flex-1">
            <FileList
              files={files()}
              folders={folders()}
              isLoading={isLoading()}
              currentPath={currentFolder() || ''}
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              onContextMenu={handleContextMenu}
              selectedItems={selectedItems()}
              onSelectItem={handleSelectItem}
              onFileDelete={handleDelete}
              onFileRename={handleFileRename}
              onFileDuplicate={handleDuplicate}
              onFilePreview={handlePreview}
              onFileDownload={handleDownload}
              onFileProperties={handleShowProperties}
            />
          </div>
          
          {/* Storage usage */}
          <div class="mb-6">
            <StorageUsageBar />
          </div>
          
          {/* Create Folder Dialog */}
          <Dialog
            isOpen={showCreateFolderDialog()}
            onClose={() => setShowCreateFolderDialog(false)}
            title="Create Folder"
          >
            <div class="p-4">
              <Input
                type="text"
                placeholder="Folder Name"
                value={newFolderName()}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
            </div>
            <div class="flex justify-end gap-2 p-4 border-t border-background-light">
                <Button 
                variant="text"
                  onClick={() => setShowCreateFolderDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                variant="primary"
                  onClick={handleCreateFolder}
                disabled={!newFolderName() || isCreatingFolder()}
                >
                {isCreatingFolder() ? <Spinner size="sm" /> : 'Create'}
                </Button>
              </div>
          </Dialog>
          
          {/* Duplicate folder name dialog */}
          <DuplicateDialog
            isOpen={showDuplicateFolderDialog()}
            itemType="folder"
            itemNames={[duplicateFolderName()]}
            onAction={(action) => {
              switch (action) {
                case 'keep-both':
                  handleKeepBoth();
                  break;
                case 'overwrite':
                  handleOverwrite();
                  break;
                case 'cancel':
                  setShowDuplicateFolderDialog(false);
                  break;
              }
            }}
            onClose={() => setShowDuplicateFolderDialog(false)}
          />
          
          {/* File Properties Dialog */}
          <Dialog
            isOpen={showPropertiesDialog()}
            onClose={() => setShowPropertiesDialog(false)}
            title="File Properties"
            size="lg"
          >
            <Show when={selectedFile()}>
              <FileProperties 
                file={selectedFile()!} 
                onClose={() => setShowPropertiesDialog(false)}
              />
            </Show>
          </Dialog>
          
          {/* File Preview Dialog */}
          <Dialog
            isOpen={showPreviewDialog()}
            onClose={() => setShowPreviewDialog(false)}
            title={selectedFile()?.name || 'Preview'}
            size="xl"
          >
            <Show when={selectedFile()}>
              <div class="p-4 flex justify-center">
                <FilePreview 
                  file={selectedFile()!} 
                  onClose={() => setShowPreviewDialog(false)}
                  getPreviewData={(fileId) => fileService.getFilePreview(fileId)}
                />
              </div>
            </Show>
          </Dialog>
          
          {/* Context Menu */}
          <Show when={showContextMenu() && contextMenuPosition() && selectedFile()}>
            <FileContextMenu
              file={selectedFile()}
              position={contextMenuPosition()}
              onClose={() => setShowContextMenu(false)}
              onReload={() => loadFiles()}
              onViewDetails={handleShowProperties}
              onPreview={handlePreview}
              onDownload={() => handleDownload()}
              onRename={handleRenameFromContextMenu}
              onDuplicate={() => handleDuplicate()}
              onDelete={() => handleDelete()}
              isBin={false}
            />
          </Show>
          
          {/* Rename Dialog */}
          <Show when={showRenameDialog() && fileToRename()}>
            <Dialog
              title="Rename"
              isOpen={showRenameDialog()}
              onClose={() => setShowRenameDialog(false)}
            >
              <div class="p-6">
                <div class="mb-4">
                  <label for="rename-input" class="block text-sm font-medium text-text-muted mb-1">
                    New name
                  </label>
                  <Input
                    id="rename-input"
                    type="text"
                    value={newFileName()}
                    onInput={(e) => setNewFileName(e.currentTarget.value)}
                    placeholder="Enter new name"
                    class="w-full"
                    autofocus
                    onKeyPress={(e) => e.key === 'Enter' && confirmRename()}
                  />
                </div>
                
                <div class="flex justify-end space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowRenameDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={confirmRename}
                    disabled={isRenaming() || !newFileName() || newFileName() === fileToRename()!.name}
                  >
                    {isRenaming() ? (
                      <>
                        <Spinner size="sm" class="mr-2" />
                        Renaming...
                      </>
                    ) : (
                      'Rename'
                    )}
                  </Button>
                </div>
              </div>
            </Dialog>
          </Show>
        </div>
      </div>
      
      {/* Size Warning Dialog */}
      <Show when={showSizeWarningDialog()}>
        <Dialog
          isOpen={showSizeWarningDialog()}
          onClose={cancelSizeWarning}
          title="Size Warning"
        >
          <div class="p-4">
            <p class="text-text-muted mb-4">
              The selected files are larger than 50MB. This may exceed the storage limit.
            </p>
            <div class="flex justify-end gap-2">
              <Button 
                variant="secondary"
                onClick={cancelSizeWarning}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={confirmSizeWarning}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Dialog>
      </Show>
      
      {/* Overwrite Confirmation Dialog */}
      <Show when={showConfirmOverwrite()}>
        <DuplicateDialog
          isOpen={showConfirmOverwrite()}
          itemType="file"
          itemNames={existingFileNames()}
          onAction={(action) => confirmOverwrite(action)}
          onClose={cancelOverwrite}
        />
      </Show>
      
      <UploadBar />
    </div>
  );
} 