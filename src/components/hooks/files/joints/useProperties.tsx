import { fileService } from '../../../../services/fileService';
import { fileStore, FileProperties } from '../../../store/FileStore';

/**
 * Hook for displaying and managing file properties
 */
export function useProperties() {
  
  const loadProperties = async (fileId: string): Promise<FileProperties | null> => {
    if (!fileId) {
      fileStore.setPropertiesError('Invalid file ID');
      return null;
    }
    
    fileStore.setPropertiesLoading(true);
    fileStore.setPropertiesError(null);
    
    try {
      // Get file details
      const file = await fileService.getFileProperties(fileId);
      if (!file) {
        throw new Error('File not found');
      }
      // Update selected file
      fileStore.setSelectedFile(file);
      
      // Format the properties to match the UI requirements
      const properties: FileProperties = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || 'Unknown type',
        location: file.location || (file.isBin || file.isInBin ? 'Bin' : 'Drive'),
        size: file.size || 0,
        createdAt: file.createdAt || '',
        updatedAt: file.updatedAt
      };
      
      fileStore.setProperties(properties);
      fileStore.setPropertiesLoading(false);
      return properties;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file properties';
      fileStore.setPropertiesError(errorMessage);
      fileStore.setSelectedFile(null);
      throw error;
    }
  };
  
  return {
    loadProperties,
    selectedFile: () => fileStore.state.selectedFile,
    properties: () => fileStore.state.properties,
    loading: () => fileStore.state.propertiesLoading,
    error: () => fileStore.state.propertiesError
  };
}
