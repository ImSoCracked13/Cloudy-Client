import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for permanently deleting files functionality
 */
export function useDeleteForever() {

  const deleteForever = async (fileId: string): Promise<boolean> => {
    fileStore.setDeleteLoading(true);
    fileStore.setDeleteError(null);

    try {
      const result = await fileService.deleteFile(fileId);
      fileStore.setDeleteLoading(false);
      return result;
    } catch (error) {
      fileStore.setDeleteError(error instanceof Error ? error.message : 'Failed to delete file');
      return false;
    }
  };

  return {
    deleteForever,
    loading: () => fileStore.state.deleteLoading,
    error: () => fileStore.state.deleteError
  };
}
