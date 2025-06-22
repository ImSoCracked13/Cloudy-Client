import { createEffect } from 'solid-js';
import { fileStore, fileActions } from '../stores/fileStore';
import { fileGateway } from '../gateway/fileGateway';
import type { FileItem, FolderContents } from '../types/fileType';

/**
 * Hook to use the file store
 * Provides access to file state and actions plus helper methods for file operations
 */
export function useFiles() {
  // Helper function to load folder contents
  const loadFolder = async (folderId: string = 'root') => {
    try {
      fileActions.setLoading(true);
      
      // Use the gateway to get folder contents
      const contents = await fileGateway.getFolderContents(folderId);
      
      // Update store with the fetched data
      fileActions.setFolderContents(contents);
      fileActions.setCurrentFolder(folderId, contents.path.split('/'));
      
      return contents;
    } catch (error) {
      console.error('Error loading folder contents:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to load folder contents');
      return null;
    } finally {
      fileActions.setLoading(false);
    }
  };
  
  // Helper function to upload a file
  const uploadFile = async (file: File, folderId: string = fileStore.state.currentFolder) => {
    try {
      const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a progress handler
      const onProgress = (progress: number) => {
        fileActions.updateUploadProgress(fileId, progress);
      };
      
      // Update progress in store
      fileActions.updateUploadProgress(fileId, 0);
      
      // Use the gateway to upload file
      const result = await fileGateway.uploadFile(file, folderId, onProgress);
      
      // Clear progress when done
      fileActions.clearUploadProgress(fileId);
      
      // Refresh folder contents
      await loadFolder(folderId);
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to upload file');
      return null;
    }
  };
  
  // Helper function to delete files
  const deleteFiles = async (fileIds: string[]) => {
    try {
      fileActions.setLoading(true);
      
      // Use the gateway to delete files
      await Promise.all(fileIds.map(id => fileGateway.deleteFile(id)));
      
      // Clear selection
      fileActions.clearSelection();
      
      // Refresh folder contents
      await loadFolder(fileStore.state.currentFolder);
      
      return true;
    } catch (error) {
      console.error('Error deleting files:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to delete files');
      return false;
    } finally {
      fileActions.setLoading(false);
    }
  };
  
  // Helper function to create a folder
  const createFolder = async (folderName: string, parentId: string = fileStore.state.currentFolder) => {
    try {
      fileActions.setLoading(true);
      
      // Use the gateway to create folder
      const result = await fileGateway.createFolder(folderName, parentId);
      
      // Refresh folder contents
      await loadFolder(parentId);
      
      return result;
    } catch (error) {
      console.error('Error creating folder:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to create folder');
      return null;
    } finally {
      fileActions.setLoading(false);
    }
  };
  
  // Helper function to rename a file or folder
  const rename = async (fileId: string, newName: string) => {
    try {
      fileActions.setLoading(true);
      
      // Use the gateway to rename
      const result = await fileGateway.renameFile(fileId, newName);
      
      // Refresh folder contents
      await loadFolder(fileStore.state.currentFolder);
      
      return result;
    } catch (error) {
      console.error('Error renaming file/folder:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to rename file/folder');
      return null;
    } finally {
      fileActions.setLoading(false);
    }
  };
  
  // Helper function to search files
  const searchFiles = async (query: string) => {
    try {
      fileActions.setLoading(true);
      fileActions.setSearchQuery(query);
      
      // Use the gateway to search
      const results = await fileGateway.searchFiles(query);
      
      return results;
    } catch (error) {
      console.error('Error searching files:', error);
      fileActions.setError(error instanceof Error ? error.message : 'Failed to search files');
      return null;
    } finally {
      fileActions.setLoading(false);
    }
  };
  
  return {
    // State getters
    currentFolder: () => fileStore.state.currentFolder,
    folderContents: () => fileStore.state.folderContents,
    folderPath: () => fileStore.state.folderPath,
    selectedFiles: () => fileStore.state.selectedFiles,
    isLoading: () => fileStore.state.isLoading,
    error: () => fileStore.state.error,
    viewMode: () => fileStore.state.viewMode,
    sortBy: () => fileStore.state.sortBy,
    sortDirection: () => fileStore.state.sortDirection,
    searchQuery: () => fileStore.state.searchQuery,
    uploadProgress: () => fileStore.state.uploadProgress,
    recentFiles: () => fileStore.state.recentFiles,
    
    // Store actions
    setCurrentFolder: fileActions.setCurrentFolder,
    setSelectedFiles: fileActions.setSelectedFiles,
    toggleFileSelection: fileActions.toggleFileSelection,
    clearSelection: fileActions.clearSelection,
    setViewMode: fileActions.setViewMode,
    setSorting: fileActions.setSorting,
    
    // Helper methods
    loadFolder,
    uploadFile,
    deleteFiles,
    createFolder,
    rename,
    searchFiles
  };
}

export default useFiles; 