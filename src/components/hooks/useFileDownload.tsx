import { createSignal } from 'solid-js';
import { saveAs } from 'file-saver';
import { fileService } from '../services/fileService';
import { notificationService } from '../common/Notification';
import { formatFileSize } from '../utilities/fileSizeFormatter';

export function useFileDownload() {
  const [downloadProgress, setDownloadProgress] = createSignal(0);
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  /**
   * Download a file with progress tracking
   * @param fileId File ID to download
   * @param fileName Name to save file as
   * @param isFolder Whether the item is a folder (download as ZIP)
   */
  const downloadFile = async (fileId: string, fileName: string, isFolder: boolean = false): Promise<void> => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);
    
    try {
      // Show progress starting
      setDownloadProgress(10);
      
      let blob: Blob;
      blob = await fileService.downloadFile(fileId, fileName, isFolder);
      
      // Show progress after download is complete
      setDownloadProgress(90);
      
      // Use FileSaver.js to save the file
      const safeName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
      
      // For folders, ensure zip extension
      const downloadName = isFolder 
        ? safeName.endsWith('.zip') ? safeName : `${safeName}.zip`
        : safeName;
      
      saveAs(blob, downloadName);
      setDownloadProgress(100);
      
      // Reset after a delay
      setTimeout(() => {
        setDownloadProgress(0);
        setIsDownloading(false);
      }, 1000);
      
      const fileSize = formatFileSize(blob.size);
      notificationService.success(`Downloaded ${fileName} (${fileSize}) successfully`);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError(error instanceof Error ? error.message : 'Unknown download error');
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };
  
  /**
   * Reset the download state
   */
  const resetDownload = () => {
    setDownloadProgress(0);
    setIsDownloading(false);
    setDownloadError(null);
  };
  
  return {
    downloadFile,
    downloadProgress,
    isDownloading,
    downloadError,
    resetDownload
  };
} 