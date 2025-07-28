import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

/**
 * Hook for file duplication functionality
 */
export function useDuplicate() {

  const duplicateFile = async (fileId: string): Promise<FileItem | null> => {
    fileStore.setDuplicateLoading(true);
    fileStore.setDuplicateError(null);

    try {
      const result = await fileService.duplicateFile(fileId);
      fileStore.setDuplicateLoading(false);
      return result;
    } catch (error) {
      fileStore.setDuplicateError(error instanceof Error ? error.message : 'Failed to duplicate file');
      return null;
    }
  };

  return {
    duplicateFile,
    loading: () => fileStore.state.duplicateLoading,
    error: () => fileStore.state.duplicateError
  };
}
