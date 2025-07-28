import { fileStore } from '../../../store/FileStore';
import { FileItem } from '../../../../types/fileType';

/**
 * Hook for client-side file searching functionality
 */
export function useSearch() {

  const searchFiles = async (query: string, files: FileItem[]) => {
    fileStore.setSearchLoading(true);
    fileStore.setSearchError(null);

    try {
      if (!query.trim()) {
        fileStore.setSearchResults(files);
        return files;
      }

      const searchTerm = query.toLowerCase().trim();
      const results = files.filter(file => {
        const fileName = file.name.toLowerCase();
        const fileType = file.type?.toLowerCase() || '';
        const mimeType = file.mimeType?.toLowerCase() || '';

        // Search in file name
        if (fileName.includes(searchTerm)) {
          return true;
        }

        // Search in file type
        if (fileType.includes(searchTerm)) {
          return true;
        }

        // Search in mime type
        if (mimeType.includes(searchTerm)) {
          return true;
        }

        return false;
      });

      fileStore.setSearchResults(results);
      fileStore.setSearchLoading(false);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search files';
      fileStore.setSearchError(errorMessage);
      return [];
    }
  };

  const clearSearch = () => {
    fileStore.clearSearch();
  };

  return {
    searchFiles,
    clearSearch,
    searchResults: () => fileStore.state.searchResults,
    loading: () => fileStore.state.searchLoading,
    error: () => fileStore.state.searchError
  };
}
