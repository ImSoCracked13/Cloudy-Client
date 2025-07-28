import { batch } from 'solid-js';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';

/**
 * Hook for file download functionality
 */
export function useDownload() {

  /**
   * Simulates download progress with variable speed
   */
  const simulateProgress = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        // Progress simulation with variable increments
        const increment = Math.floor(Math.random() * 15) + 5; // Random increment between 5-20%
        progress += increment;
        
        if (progress >= 95) {
          clearInterval(interval);
          fileStore.setDownloadProgress(95); // Cap at 95% until actual download completes
          resolve();
        } else {
          fileStore.setDownloadProgress(progress);
        }
      }, 150); // Update every 150ms for smoother animation
    });
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      batch(() => {
        fileStore.setDownloadLoading(true);
        fileStore.setDownloadError(null);
        fileStore.setDownloadProgress(0);
      });

      // Start progress simulation in parallel with actual download
      const simulationPromise = simulateProgress();
      
      // Actual download
      const blob = await fileService.downloadFile(fileId);
      
      // Wait for simulation to reach ~95% if it hasn't already
      await simulationPromise;
      
      // Set progress to 100% when download completes
      fileStore.setDownloadProgress(100);

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
        fileStore.setDownloadProgress(0);
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
      fileStore.setDownloadProgress(0);
    });
  };

  return {
    downloadFile,
    resetDownload,
    loading: () => fileStore.state.downloadLoading,
    error: () => fileStore.state.downloadError,
    progress: () => fileStore.state.downloadProgress
  };
} 