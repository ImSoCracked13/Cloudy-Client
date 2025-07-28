import { batch } from 'solid-js';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

/**
 * Hook for file upload functionality with simulated progress
 */
export function useUpload() {

  const addToUploadQueue = (files: File[], parentId?: string | null) => {
    const newUploads = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    fileStore.setUploads([...fileStore.state.uploads, ...newUploads]);
    return newUploads;
  };

  const updateUploadProgress = (file: File, progress: number) => {
    batch(() => {
      fileStore.updateUpload(file, {
        progress,
        status: progress >= 100 ? 'completed' : 
                progress > 0 ? 'uploading' : 
                'pending'
      });
    });
  };

  const simulateProgress = (file: File) => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10; // Increment by 10-30%
        if (progress >= 95) {
          clearInterval(interval);
          resolve();
        }
        updateUploadProgress(file, progress);
      }, 150); // Update every 150ms (faster than before)
    });
  };

  const uploadFile = async (file: File, parentId?: string | null) => {
    try {
      batch(() => {
        fileStore.setUploadLoading(true);
        fileStore.updateUpload(file, { status: 'uploading', progress: 0 });
      });

      // Faster simulation
      await simulateProgress(file);

      // Actual upload would go here
      const result = await fileService.uploadFile(
        file,
        parentId,
        (progress) => updateUploadProgress(file, progress)
      );

      // Immediately mark as complete
      updateUploadProgress(file, 100);
      fileStore.setUploadLoading(false);

      return result;
    } catch (error) {
      batch(() => {
        fileStore.setUploadError(error instanceof Error ? error.message : 'Upload failed');
        fileStore.updateUpload(file, { 
          status: 'error', 
          progress: 0, 
          error: String(error) 
        });
      });
      return null;
    }
  };

  const startUploads = async (parentId?: string | null) => {
    const pendingUploads = fileStore.state.uploads.filter(u => u.status === 'pending');
    const results: FileItem[] = [];
    let hasError = false;

    for (const upload of pendingUploads) {
      try {
        const result = await uploadFile(upload.file, parentId);
        if (result) {
          results.push(result);
        }
      } catch (uploadError) {
        hasError = true;
        console.error('Error uploading file:', upload.file.name, uploadError);
      }
    }

    // Reset upload loading state after all uploads complete
    fileStore.setUploadLoading(false);

    if (hasError && results.length === 0) {
      throw new Error('All uploads failed');
    }

    return results;
  };

  const clearCompleted = () => {
    fileStore.clearCompletedUploads();
  };

  const clearAllUploads = () => {
    fileStore.clearAllUploads();
  };

  const retryUpload = async (file: File, parentId?: string | null) => {
    fileStore.updateUpload(file, {
      status: 'pending',
      progress: 0,
      error: undefined
    });
    return await uploadFile(file, parentId);
  };

  return {
    uploads: () => fileStore.state.uploads,
    loading: () => fileStore.state.uploadLoading,
    error: () => fileStore.state.uploadError,
    addToUploadQueue,
    startUploads,
    clearCompleted,
    clearAllUploads,
    retryUpload
  };
}