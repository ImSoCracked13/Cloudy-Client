import { fileStore } from '../../../store/FileStore';
import { FileItem, getFileType } from '../../../../types/fileType';

export type FilterType = 'all' | 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';

// More comprehensive file type patterns
const FILE_TYPE_PATTERNS = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'],
    mimeTypes: ['image/'],
    typeMatches: ['image']
  },
  document: {
    extensions: ['.doc', '.docx', '.pdf', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.rtf', '.md', '.odt', '.ods', '.odp'],
    mimeTypes: ['application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'application/vnd.oasis.opendocument'],
    typeMatches: ['document', 'text', 'pdf', 'word', 'excel', 'powerpoint', 'spreadsheet', 'presentation']
  },
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp'],
    mimeTypes: ['video/'],
    typeMatches: ['video']
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.flac', '.opus'],
    mimeTypes: ['audio/'],
    typeMatches: ['audio']
  },
  archive: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso'],
    mimeTypes: ['application/zip', 'application/x-rar', 'application/x-7z', 'application/x-tar', 'application/gzip', 'application/x-bzip2'],
    typeMatches: ['archive', 'zip', 'rar']
  },
  other: {
    extensions: [],
    mimeTypes: [],
    typeMatches: []
  }
};

/**
 * Hook for file filtering functionality
 */
export function useFilter() {

  const matchesFileType = (file: FileItem, type: FilterType): boolean => {
    if (type === 'all') return true;

    // Special handling for "other" type - files that don't match any other type
    if (type === 'other') {
      const otherTypes: FilterType[] = ['image', 'document', 'video', 'audio', 'archive'];
      return !otherTypes.some(otherType => matchesSpecificFileType(file, otherType));
    }

    return matchesSpecificFileType(file, type);
  };

  const matchesSpecificFileType = (file: FileItem, type: FilterType): boolean => {
    const patterns = FILE_TYPE_PATTERNS[type];
    if (!patterns) return false;

    const fileName = file.name.toLowerCase();
    const mimeType = (file.mimeType || '').toLowerCase();
    const fileType = (file.type || '').toLowerCase();

    // Check file extension
    if (patterns.extensions.some(ext => fileName.endsWith(ext))) {
      return true;
    }

    // Check mime type
    if (patterns.mimeTypes.some(mime => mimeType.includes(mime))) {
      return true;
    }

    // Check type property
    if (patterns.typeMatches.some(t => fileType === t)) {
      return true;
    }

    // Use the getFileType helper as a fallback
    const detectedType = getFileType(fileName, mimeType);
    return patterns.typeMatches.includes(detectedType);
  };

  const matchesAnyFileType = (file: FileItem, types: FilterType[]): boolean => {
    // If no types specified, show all files
    if (!types || types.length === 0) return true;
    
    // Check if file matches any of the specified types
    return types.some(type => matchesFileType(file, type));
  };

  const filterFiles = async (types: FilterType[] | null, files: FileItem[]): Promise<FileItem[]> => {
    fileStore.setFilterLoading(true);
    fileStore.setFilterError(null);
    fileStore.setActiveFilter(types || []);

    try {
      
      let filtered: FileItem[];
      
      if (!types || types.length === 0) {
        filtered = [...files];
      } else {
        filtered = files.filter(file => matchesAnyFileType(file, types));
      }
      
      fileStore.setFilteredFiles(filtered);
      fileStore.setFilterLoading(false);
      return filtered;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to filter files';
      fileStore.setFilterError(errorMessage);
      console.error('Filter error:', error);
      return files; // Return original files on error
    }
  };

  return {
    filterFiles,
    filteredFiles: () => fileStore.state.filteredFiles,
    activeFilter: () => fileStore.state.activeFilter,
    loading: () => fileStore.state.filterLoading,
    error: () => fileStore.state.filterError
  };
}
