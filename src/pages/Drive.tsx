import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { FileItem } from '../components/types/file';
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
  
  // Dialog states
  const [showCreateFolderDialog, setShowCreateFolderDialog] = createSignal(false);
  const [newFolderName, setNewFolderName] = createSignal('');
  const [showPropertiesDialog, setShowPropertiesDialog] = createSignal(false);
  const [showPreviewDialog, setShowPreviewDialog] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  
  // Context menu
  const [showContextMenu, setShowContextMenu] = createSignal(false);
  const [contextMenuPosition, setContextMenuPosition] = createSignal({ x: 0, y: 0 });
  
  // File upload
  const { uploadFiles, uploadProgress, isUploading } = useFileUpload();
  
  // Drag and drop
  const { isDragging, bindDragEvents } = useDragDrop({
    onDrop: (files) => handleFileDrop(files)
  });

  const dragRef = (el: HTMLDivElement) => {
    bindDragEvents(el);
  };
  
  // Handle folder ID from URL params
  createEffect(() => {
    const folderId = params.folderId;
    setCurrentFolder(folderId);
    loadFiles(folderId);
    updateBreadcrumb(folderId);
  });
  
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
  
  const loadFiles = async (folderId?: string) => {
    setIsLoading(true);
    try {
      const items = await fileService.getFiles(folderId || null, false);
      
      // Separate files and folders
      setFolders(items.filter(item => item.isFolder));
      setFiles(items.filter(item => !item.isFolder));
      
      // Clear selected items when changing folders
      setSelectedItems([]);
    } catch (error) {
      console.error('Error loading files:', error);
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
      
      // Separate files and folders
      setFolders(results.filter(item => item.isFolder));
      setFiles(results.filter(item => !item.isFolder));
      
      // Clear selected items when searching
      setSelectedItems([]);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadFiles(currentFolder());
  };
  
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreviewDialog(true);
  };
  
  const handleFolderClick = (folder: FileItem) => {
    // Navigate to folder
    window.location.href = `/drive/${folder.id}`;
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
  
  const handleCreateFolder = async () => {
    if (!newFolderName()) return;
    
    try {
      await fileService.createFolder(newFolderName(), currentFolder() || null);
      // Reload files to show the new folder
      loadFiles(currentFolder());
      setShowCreateFolderDialog(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };
  
  const handleFileDrop = async (droppedFiles: File[]) => {
    if (droppedFiles.length === 0) return;
    
    try {
      for (const file of droppedFiles) {
        await uploadFiles([file], currentFolder() || null);
      }
      loadFiles(currentFolder());
    } catch (error) {
      console.error('Error uploading dropped files:', error);
    }
  };
  
  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    try {
      await uploadFiles(Array.from(input.files), currentFolder() || null);
      loadFiles(currentFolder());
      input.value = ''; // Reset input
    } catch (error) {
      console.error('Error uploading files:', error);
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
    if (!newName) return;
    
    try {
      // Mock implementation until the API is available
      console.log(`Renaming ${file.name} to ${newName}`);
      loadFiles(currentFolder());
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };
  
  const handleDuplicate = async () => {
    if (!selectedFile()) return;
    
    try {
      // Mock implementation until the API is available
      console.log(`Duplicating ${selectedFile()!.name}`);
      loadFiles(currentFolder());
    } catch (error) {
      console.error('Error duplicating file:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedFile()) return;
    
    try {
      await fileService.moveToTrash(selectedFile()!.id, selectedFile()!.name);
      loadFiles(currentFolder());
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  const handleShowProperties = () => {
    if (selectedFile()) {
      setShowPropertiesDialog(true);
    }
  };

  // Calculate the average upload progress
  const getAverageUploadProgress = () => {
    const progressValues = Object.values(uploadProgress);
    if (progressValues.length === 0) return 0;
    
    const totalProgress = progressValues.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(totalProgress / progressValues.length);
  };

  // Add a wrapper function for the context menu rename handler
  const handleRenameFromContextMenu = (newName: string) => {
    if (selectedFile() && newName) {
      handleFileRename(selectedFile()!, newName);
    }
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
                  New Folder
                </Button>
                
                <label class="cursor-pointer">
                  <Button size="md">
                    <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </Button>
                  <input 
                    type="file" 
                    class="hidden" 
                    multiple 
                    onChange={handleFileUpload}
                  />
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
                  <span class="text-sm font-medium text-primary">{getAverageUploadProgress()}%</span>
                </div>
                <div class="w-full bg-background-light rounded-full h-2.5">
                  <div 
                    class="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${getAverageUploadProgress()}%` }}
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
            title="Create New Folder"
          >
            <div class="p-4">
              <Input
                type="text"
                placeholder="Folder name"
                value={newFolderName()}
                onInput={(e) => setNewFolderName(e.currentTarget.value)}
                class="mb-4"
                fullWidth
              />
              
              <div class="flex justify-end gap-2">
                <Button 
                  variant="secondary"
                  onClick={() => setShowCreateFolderDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName().trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </Dialog>
          
          {/* File Properties Dialog */}
          <Dialog
            isOpen={showPropertiesDialog()}
            onClose={() => setShowPropertiesDialog(false)}
            title="File Properties"
            size="lg"
          >
            <Show when={selectedFile()}>
              <FileProperties file={selectedFile()!} />
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
                <FilePreview file={selectedFile()!} size="lg" />
              </div>
            </Show>
          </Dialog>
          
          {/* Context Menu */}
          <Show when={showContextMenu() && selectedFile()}>
            <FileContextMenu
              file={selectedFile()!}
              position={contextMenuPosition()}
              onClose={() => setShowContextMenu(false)}
              onReload={() => loadFiles(currentFolder())}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onRename={handleRenameFromContextMenu}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onViewDetails={handleShowProperties}
            />
          </Show>
        </div>
      </div>
    </div>
  );
} 