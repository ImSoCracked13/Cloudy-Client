import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for emptying bin functionality
 */
export function useEmptyBin() {

  const emptyBin = async (): Promise<boolean> => {
    fileStore.setEmptyBinLoading(true);
    fileStore.setEmptyBinError(null);

    try {
      const result = await fileService.emptyBin();
      fileStore.setEmptyBinLoading(false);
      return result;
    } catch (error) {
      fileStore.setEmptyBinError(error instanceof Error ? error.message : 'Failed to empty bin');
      return false;
    }
  };

  return {
    emptyBin,
    loading: () => fileStore.state.emptyBinLoading,
    error: () => fileStore.state.emptyBinError
  };
}
