import { For, createSignal, createEffect, onMount, Show } from 'solid-js';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import FileItemComponent from './FileItem';
import FileContextMenu from './FileContextMenu';
import FilePreview from '../drive/FilePreview';
import { type FileItem } from '../../../handlers/FileHandler';

interface FileListProps {
  currentPath: string;
  onFileClick: (file: FileItem) => void;
  onFileDelete: (file: FileItem) => void;
  onFileRename: (file: FileItem, newName: string) => void;
  onFileDuplicate?: (file: FileItem) => void;
  onFilePreview?: (file: FileItem) => void;
  onFileDownload: (file: FileItem) => void;
  onFileProperties: (file: FileItem) => void;
  onFileRestore?: (file: FileItem) => void;
  onFileDeleteForever?: (file: FileItem) => void;
  onContextMenu?: (item: FileItem, e: MouseEvent) => void;
  isBin?: boolean;
  filterType?: string | null;
  filterTypes?: string[];
  searchTerm?: string;
}

export default function FileList(props: FileListProps) {
  const { 
    files, 
    loading, 
    fetchFiles, 
    refreshFiles,
    getCurrentLocation
  } = useFilesList();
  
  const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = createSignal<{ x: number; y: number } | null>(null);
  const [previewFile, setPreviewFile] = createSignal<FileItem | null>(null);

  // Initial load on mount
  onMount(() => {
    const isBin = props.isBin || false;
    fetchFiles(isBin, false);
  });

  // Watch for isBin prop changes
  createEffect(() => {
    const isBin = props.isBin || false;
    const currentIsBin = getCurrentLocation() === 'bin';
    
    // Only fetch if the bin state has actually changed
    if (isBin !== currentIsBin) {
      console.log(`FileList prop changed - isBin: ${isBin}, currentLocation: ${getCurrentLocation()}`);
      fetchFiles(isBin, false);
    }
  });
  
  // File type patterns matching the useFilter hook logic
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
    }
  };

  // Check if file matches a specific filter type using comprehensive matching
  const matchesFilterType = (file: FileItem, filterType: string): boolean => {
    if (!filterType) return true;

    // Handle "other" type - files that don't match any specific type
    if (filterType === 'other') {
      const specificTypes = ['image', 'document', 'video', 'audio', 'archive'];
      return !specificTypes.some(type => matchesSpecificFilterType(file, type));
    }

    return matchesSpecificFilterType(file, filterType);
  };

  const matchesSpecificFilterType = (file: FileItem, filterType: string): boolean => {
    const patterns = FILE_TYPE_PATTERNS[filterType as keyof typeof FILE_TYPE_PATTERNS];
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

    return false;
  };

  // Get filtered files
  const getDisplayFiles = () => {
    let filesToDisplay = [...files()];
    
    // Apply search if specified
    if (props.searchTerm) {
      const searchTerm = props.searchTerm.toLowerCase();
      filesToDisplay = filesToDisplay.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply filter by type if specified
    if (props.filterType) {
      filesToDisplay = filesToDisplay.filter(file => 
        file.type === props.filterType || 
        (props.filterType === 'file')
      );
    }
    
    // Apply multiple filter types if specified
    if (props.filterTypes && props.filterTypes.length > 0) {
      filesToDisplay = filesToDisplay.filter(file => {
        // Check if the file matches any of the selected filter types
        const shouldInclude = props.filterTypes!.some(filterType => 
          matchesFilterType(file, filterType)
        );
        return shouldInclude;
      });
    }
    
    // Return files list in their natural order
    return filesToDisplay;
  };
  
  const getFiles = () => {
    return getDisplayFiles().filter(item => !item.isBin);
  };

  
  // Determine if file can be previewed
  const canPreview = (file: FileItem) => {
    const previewableTypes = [
      'image/', 
      'text/', 
      'application/pdf',
      'video/',
      'audio/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint'
    ];
    return previewableTypes.some(type => file.mimeType?.startsWith(type));
  };

  // Handle file click
  const handleFileClick = (file: FileItem) => {
      props.onFileClick(file);
      // If file is in Bin, disable preview
      if (canPreview(file) && !props.isBin) {
        setPreviewFile(file);
      }
  };
  
  // Handle context menu
  const handleContextMenu = (file: FileItem, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close any existing context menu first
    handleContextMenuClose();
    
    // Calculate position, ensuring menu stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 150); // 150 is approximate menu width
    const y = Math.min(e.clientY, window.innerHeight - 300); // 300 is approximate max menu height
    
    setSelectedFile(file);
    setContextMenuPosition({ x, y });
    
    if (props.onContextMenu) {
      props.onContextMenu(file, e);
    }
  };
  
  // Handle context menu close
  const handleContextMenuClose = () => {
    setSelectedFile(null);
    setContextMenuPosition(null);
  };
  
  return (
    <div class="relative">
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-center h-64">
            <div class="text-text-muted">Loading files...</div>
          </div>
        }
      >
        <Show
          when={getDisplayFiles().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center gap-4 p-8 text-text-muted">
              <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              <p class="text-lg">No items found</p>
              {props.filterType && (
                <p class="text-sm">Try changing or clearing the filter</p>
              )}
            </div>
          }
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            
            {/* Files */}
            <For each={getFiles()}>
              {(file) => (
                <FileItemComponent
                  file={file}
                  onDoubleClick={() => handleFileClick(file)}
                  onOpenContextMenu={handleContextMenu}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>
      
      {/* Context Menu */}
      <Show when={selectedFile() && contextMenuPosition()}>
        <FileContextMenu
          file={selectedFile()!}
          position={contextMenuPosition()!}
          show={true}
          onClose={handleContextMenuClose}
          onReload={() => {
            handleContextMenuClose();
            refreshFiles(props.isBin || false);
          }}
          isBin={props.isBin || false}
        />
      </Show>

      {/* File Preview */}
      <Show when={previewFile()}>
        <FilePreview
          file={previewFile()!}
          onClose={() => setPreviewFile(null)}
          isOpen={true}
        />
      </Show>
    </div>
  );
}