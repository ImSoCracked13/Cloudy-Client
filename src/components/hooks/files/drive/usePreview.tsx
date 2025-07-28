import { fileService } from '../../../../services/fileService';
import { fileStore, FilePreview } from '../../../store/FileStore';

/**
 * Hook for file preview functionality
 */
export function usePreview() {

  const getPreview = async (fileId: string): Promise<FilePreview | null> => {
    fileStore.setPreviewLoading(true);
    fileStore.setPreviewError(null);

    try {
      const result = await fileService.previewFile(fileId);
      if (!result) return null;

      // Convert FilePreviewDto to FilePreview
      const previewData: FilePreview = {
        id: fileId,
        name: result.name,
        type: result.type,
        content: result.content || '',
        url: result.url,
        size: result.size
      };

      fileStore.setPreview(previewData);
      fileStore.setPreviewLoading(false);
      return previewData;
    } catch (error) {
      fileStore.setPreviewError(error instanceof Error ? error.message : 'Failed to get file preview');
      return null;
    }
  };

  const clearPreview = () => {
    fileStore.clearPreview();
  };

  return {
    getPreview,
    clearPreview,
    preview: () => fileStore.state.preview,
    loading: () => fileStore.state.previewLoading,
    error: () => fileStore.state.previewError
  };
}
