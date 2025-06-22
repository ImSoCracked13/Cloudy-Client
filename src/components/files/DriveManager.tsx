import { createSignal, createEffect, Show, onMount } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { fileService } from '../services/fileService';
import { FileItem } from '../types/fileType';
import FileList from './FileList';
import FileContextMenu from './FileContextMenu';
import FilePreview from './FilePreview';
import FileProperties from './FileProperties';
import Button from '../widgets/Button';
import Breadcrumb, { BreadcrumbItem } from '../widgets/Breadcrumb';
import Spinner from '../widgets/Spinner';
import { notificationService } from '../common/Notification';
import DragDropContainer from './DragDropContainer';
import { useFileDownload } from '../hooks/useFileDownload';
import { TbRefresh } from 'solid-icons/tb';

export default function DriveManager() {
  const params = useParams();
  const navigate = useNavigate();
  const { downloadFile, isDownloading } = useFileDownload();
  
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [folders, setFolders] = createSignal<FileItem[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [currentFolder, setCurrentFolder] = createSignal<FileItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = createSignal<BreadcrumbItem[]>([]);
  const [contextMenuFile, setContextMenuFile] = createSignal<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = createSignal<{ x: number; y: number } | null>(null);
  const [selectedItems, setSelectedItems] = createSignal<FileItem[]>([]);
  const [previewFile, setPreviewFile] = createSignal<FileItem | null>(null);
  const [propertiesFile, setPropertiesFile] = createSignal<FileItem | null>(null);
  const [createFolderName, setCreateFolderName] = createSignal("");
  const [isCreatingFolder, setIsCreatingFolder] = createSignal(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = createSignal(false);

  // Load files when component mounts or folder ID changes
  createEffect(() => {
    const folderId = params.folderId;
    loadFiles(folderId);
  });

  // Get current folder ID from URL params
  const currentFolderId = () => params.folderId || null;
  
  // Load files and folders for the current directory
  const loadFiles = async (folderId?: string) => {
    setIsLoading(true);
    try {
      let path = '/';
      let currentFolderDetails = null;
      
      // If we have a folderId, get the folder details first
      if (folderId) {
        try {
          currentFolderDetails = await fileService.getFileDetails(folderId);
          if (currentFolderDetails) {
            path = currentFolderDetails.objectPath || '/';
            setCurrentFolder(currentFolderDetails);
          }
        } catch (error) {
          console.error('Error loading folder details:', error);
        }
      } else {
        setCurrentFolder(null);
      }
      
      // Load files from the correct path
      const items = await fileService.getFilesByPath(path);
      
      // Separate files and folders
      setFolders(items.filter(item => item.isFolder));
      setFiles(items.filter(item => !item.isFolder));
      
      // Reset selection
      setSelectedItems([]);
      
      // Update breadcrumb
      updateBreadcrumb(currentFolderDetails);
    } catch (error) {
      console.error('Error loading files:', error);
      notificationService.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update breadcrumb navigation
  const updateBreadcrumb = async (folder: FileItem | null) => {
    try {
      if (!folder) {
        // Root directory
        setBreadcrumbs([
          { id: '', label: 'My Drive', onClick: () => navigate('/drive') }
        ]);
        return;
      }
      
      // Build breadcrumb path
      const breadcrumbItems: BreadcrumbItem[] = [
          { id: '', label: 'My Drive', onClick: () => navigate('/drive') }
      ];
      
      // Split path and create breadcrumb items
      const pathParts = folder.objectPath.split('/').filter(part => part);
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath += `/${part}`;
        breadcrumbItems.push({
          id: currentPath,
          label: part,
          onClick: () => navigate(`/drive${currentPath}`)
        });
      }
      
      setBreadcrumbs(breadcrumbItems);
    } catch (error) {
      console.error('Error updating breadcrumb:', error);
      setBreadcrumbs([
        { id: '', label: 'My Drive', onClick: () => navigate('/drive') }
      ]);
    }
  };

  // Handle file click
  const handleFileClick = (file: FileItem) => {
    setPreviewFile(file);
  };

  // Handle folder click
  const handleFolderClick = (folder: FileItem) => {
    navigate(`/drive/${folder.id}`);
  };

  // Show context menu for a file or folder
  const handleContextMenu = (item: FileItem, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFile(item);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle item selection
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

  // Close context menu
  const handleCloseContextMenu = () => {
    setContextMenuFile(null);
    setContextMenuPosition(null);
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    if (!createFolderName()) {
      notificationService.error('Folder name cannot be empty');
      return;
    }
    
    setIsCreatingFolder(true);
    try {
      await fileService.createFolder(createFolderName(), currentFolderId());
      notificationService.success(`Folder "${createFolderName()}" created successfully`);
      setCreateFolderName('');
      setShowCreateFolderDialog(false);
      loadFiles(currentFolderId());
    } catch (error) {
      console.error('Error creating folder:', error);
      notificationService.error('Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Refresh files after upload
  const handleFilesUploaded = () => {
    loadFiles(currentFolderId());
  };

  // Close file preview
  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  // Preview a file
  const handleFilePreview = (file: FileItem) => {
    setPreviewFile(file);
  };

  // Download a file
  const handleFileDownload = async (file: FileItem) => {
    try {
      if (file.isFolder) {
        await downloadFile(file.id, file.name, true);
      } else {
        await downloadFile(file.id, file.name);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      notificationService.error('Failed to download file');
    }
  };

  // Handle file duplication
  const handleFileDuplicate = async (file: FileItem) => {
    try {
      await fileService.duplicateFile(file.id, file.name);
      loadFiles(currentFolderId());
    } catch (error) {
      console.error('Error duplicating file:', error);
      notificationService.error('Failed to duplicate file');
    }
  };

  // Rename a file
  const handleFileRename = async (file: FileItem, newName: string) => {
    try {
      await fileService.renameFile(file.id, file.name, newName);
      notificationService.success(`"${file.name}" renamed to "${newName}" successfully`);
      loadFiles(currentFolderId());
    } catch (error) {
      console.error('Error renaming file:', error);
      notificationService.error('Failed to rename file');
    }
  };

  // Handle file deletion (move to trash)
  const handleFileDelete = (file: FileItem) => {
    fileService.moveToTrash(file.id)
      .then(() => {
        notificationService.success(`"${file.name}" moved to trash`);
        loadFiles(currentFolderId());
      })
      .catch((error) => {
        console.error('Error deleting file:', error);
        notificationService.error('Failed to delete file');
      });
  };

  // Show file properties
  const handleFileProperties = (file: FileItem) => {
    setPropertiesFile(file);
  };

  // Get current path for breadcrumb
  const currentPath = () => {
    return breadcrumbs();
  };
  
  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (path: string) => {
    if (path === '') {
      navigate('/drive');
    } else {
      navigate(`/drive/${path}`);
    }
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenuFile()) return;
    
    const file = contextMenuFile()!;
    
    switch (action) {
      case 'preview':
        setPreviewFile(file);
        break;
      case 'download':
        handleFileDownload(file);
        break;
      case 'rename':
        // Show rename dialog (implemented via onRename in context menu)
        break;
      case 'duplicate':
        handleFileDuplicate(file);
        break;
      case 'delete':
        handleFileDelete(file);
        break;
      case 'properties':
        handleFileProperties(file);
        break;
    }
    
    handleCloseContextMenu();
  };

  // Sync storage with MinIO
  const handleSyncStorage = async () => {
    setIsLoading(true);
    try {
      // Construct path string from current folder
      const folder = currentFolder();
      const pathString = folder ? folder.path : '/';
      
      await fileService.syncStorage(pathString, 'Drive');
      // Refresh the file list after sync
      await loadFiles(currentFolderId());
    } catch (error) {
      console.error('Error synchronizing storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DragDropContainer currentFolderId={currentFolderId()} onFilesUploaded={handleFilesUploaded}>
      <div class="p-4">
        {/* Header with breadcrumb */}
        <div class="flex items-center justify-between mb-6">
          <div class="flex-1">
            <Breadcrumb 
              items={currentPath()}
              separator="/"
              onNavigate={handleBreadcrumbNavigate}
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowCreateFolderDialog(true)}
              leftIcon={
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9-6h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
                </svg>
              }
            >
              New Folder
            </Button>
            
            <label class="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded cursor-pointer">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
              <input 
                type="file" 
                class="hidden" 
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    // Handle file upload here
                  }
                }}
              />
            </label>
            
            <button
              title="Sync Storage"
              onClick={handleSyncStorage}
              disabled={isLoading()}
              class="flex items-center justify-center w-8 h-8 rounded-full hover:bg-background-hover text-text-muted hover:text-text"
            >
              <TbRefresh class={isLoading() ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* File list */}
        <Show when={!isLoading()} fallback={<div class="flex justify-center py-10"><Spinner size="lg" /></div>}>
          <FileList 
            files={files()}
            folders={folders()}
            isLoading={isLoading()}
            currentPath={currentFolder() ? currentFolder()!.path : '/'}
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
            onFileDelete={handleFileDelete}
            onFileRename={handleFileRename}
            onFileDuplicate={handleFileDuplicate}
            onFilePreview={handleFilePreview}
            onFileDownload={handleFileDownload}
            onFileProperties={handleFileProperties}
          />
        </Show>
        
        {/* File Context Menu */}
        <Show when={contextMenuPosition() && contextMenuFile()}>
          <FileContextMenu
            file={contextMenuFile()!}
            position={contextMenuPosition()!}
            onClose={handleCloseContextMenu}
            onReload={() => loadFiles(currentFolderId())}
            onPreview={handleFilePreview}
            onDownload={handleFileDownload}
            onRename={(newName) => handleFileRename(contextMenuFile()!, newName)}
            onDuplicate={handleFileDuplicate}
            onDelete={handleFileDelete}
            onViewDetails={handleFileProperties}
          />
        </Show>
        
        {/* File Preview Dialog */}
        <Show when={previewFile()}>
          <FilePreview
            file={previewFile()!}
            onClose={handleClosePreview}
            getPreviewData={(fileId) => fileService.getFilePreview(fileId)}
          />
        </Show>
        
        {/* File Properties Dialog */}
        <Show when={propertiesFile()}>
          <FileProperties
            file={propertiesFile()!}
            onClose={() => setPropertiesFile(null)}
          />
        </Show>
        
        {/* Create Folder Dialog */}
        <Show when={showCreateFolderDialog()}>
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-background-darker p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 class="text-lg font-medium text-text mb-4">Create New Folder</h3>
              
              <input
                type="text"
                value={createFolderName()}
                onInput={(e) => setCreateFolderName(e.target.value)}
                placeholder="Folder Name"
                class="w-full px-3 py-2 bg-background-darkest border border-background-light rounded mb-4 text-text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                }}
              />
              
              <div class="flex justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateFolderDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleCreateFolder}
                  loading={isCreatingFolder()}
                  disabled={!createFolderName() || isCreatingFolder()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </DragDropContainer>
  );
} 