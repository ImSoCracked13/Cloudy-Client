import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for moving files to bin functionality
 */
export function useMoveToBin() {

  const moveToBin = async (fileId: string): Promise<boolean> => {
    fileStore.setMoveLoading(true);
    fileStore.setMoveError(null);

    try {
      await fileService.moveToBin(fileId);
      fileStore.setMoveLoading(false);
      return true;
    } catch (error) {
      fileStore.setMoveError(error instanceof Error ? error.message : 'Failed to move file to bin');
      return false;
    }
  };

  return {
    moveToBin,
    loading: () => fileStore.state.moveLoading,
    error: () => fileStore.state.moveError
  };
}
