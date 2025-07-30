import { batch } from 'solid-js';
import { fileService } from '../../../../services/fileService';
import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

/**
 * Hook for file upload functionality
 */
export function useUpload() {

  const addToUploadQueue = (files: File[]) => {
    const newUploads = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    fileStore.setUploads([...fileStore.state.uploads, ...newUploads]);
    return newUploads;
  };

  const uploadFile = async (file: File) => {
    try {
      batch(() => {
        fileStore.setUploadLoading(true);
        fileStore.updateUpload(file, { status: 'uploading', progress: 0 });
      });

      // Actual upload
      const result = await fileService.uploadFile(
        file
      );

      // Mark as complete
      fileStore.updateUpload(file, { status: 'completed', progress: 100 });
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

  const startUploads = async () => {
    const pendingUploads = fileStore.state.uploads.filter(u => u.status === 'pending');
    const results: FileItem[] = [];
    let hasError = false;

    for (const upload of pendingUploads) {
      try {
        const result = await uploadFile(upload.file);
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

  const retryUpload = async (file: File) => {
    fileStore.updateUpload(file, {
      status: 'pending',
      progress: 0,
      error: undefined
    });
    return await uploadFile(file);
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