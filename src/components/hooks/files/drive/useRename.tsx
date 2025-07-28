import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

/**
 * Hook for file renaming functionality
 */
export function useRename() {

  const renameFile = async (fileId: string, oldName: string, newName: string): Promise<FileItem | null> => {
    if (!newName.trim()) {
      fileStore.setRenameError('New name cannot be empty');
      return null;
    }

    if (oldName === newName) {
      fileStore.setRenameError('New name must be different from the current name');
      return null;
    }

    fileStore.setRenameLoading(true);
    fileStore.setRenameError(null);

    try {
      const result = await fileService.renameFile(fileId, oldName, newName);
      fileStore.setRenameLoading(false);
      return result;
    } catch (error) {
      fileStore.setRenameError(error instanceof Error ? error.message : 'Failed to rename file');
      return null;
    }
  };

  return {
    renameFile,
    loading: () => fileStore.state.renameLoading,
    error: () => fileStore.state.renameError
  };
}
