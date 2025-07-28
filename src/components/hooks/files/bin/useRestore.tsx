import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for restoring files from bin functionality
 */
export function useRestore() {

  const restore = async (fileId: string): Promise<boolean> => {
    fileStore.setRestoreLoading(true);
    fileStore.setRestoreError(null);

    try {
      await fileService.restoreFromBin(fileId);
      fileStore.setRestoreLoading(false);
      return true;
    } catch (error) {
      fileStore.setRestoreError(error instanceof Error ? error.message : 'Failed to restore file');
      return false;
    }
  };

  return {
    restore,
    loading: () => fileStore.state.restoreLoading,
    error: () => fileStore.state.restoreError
  };
}
