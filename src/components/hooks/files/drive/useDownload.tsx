import { batch } from 'solid-js';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for file download functionality
 */
export function useDownload() {

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      batch(() => {
        fileStore.setDownloadLoading(true);
        fileStore.setDownloadError(null);
      });

      // Actual download
      const blob = await fileService.downloadFile(fileId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      batch(() => {
        fileStore.setDownloadError(error instanceof Error ? error.message : 'Download failed');
      });
      return false;
    } finally {
      fileStore.setDownloadLoading(false);
    }
  };

  /**
   * Resets the download state
   */
  const resetDownload = () => {
    batch(() => {
      fileStore.setDownloadLoading(false);
      fileStore.setDownloadError(null);
    });
  };

  return {
    downloadFile,
    resetDownload,
    loading: () => fileStore.state.downloadLoading,
    error: () => fileStore.state.downloadError
  };
} 