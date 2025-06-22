import { JSX } from 'solid-js';
import { FileItem as FileItemType, getFileType } from '../types/fileType';
import { formatFileSize } from '../utilities/fileSizeFormatter';
import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { formatDate } from '../utilities/dateFormatter';

// File type color mapping
const fileTypeColors = {
  // Documents
  'application/pdf': 'text-red-500',
  'application/msword': 'text-blue-500',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text-blue-500',
  'application/vnd.ms-excel': 'text-green-500',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'text-green-500',
  'application/vnd.ms-powerpoint': 'text-orange-500',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'text-orange-500',
  'text/plain': 'text-gray-500',
  
  // Images
  'image/jpeg': 'text-purple-500',
  'image/png': 'text-purple-500',
  'image/gif': 'text-purple-500',
  'image/svg+xml': 'text-purple-500',
  'image/webp': 'text-purple-500',
  
  // Audio
  'audio/mpeg': 'text-pink-500',
  'audio/wav': 'text-pink-500',
  'audio/ogg': 'text-pink-500',
  'audio/midi': 'text-pink-500',
  
  // Video
  'video/mp4': 'text-indigo-500',
  'video/webm': 'text-indigo-500',
  'video/ogg': 'text-indigo-500',
  'video/quicktime': 'text-indigo-500',
  
  // Archives
  'application/zip': 'text-yellow-500',
  'application/x-rar-compressed': 'text-yellow-500',
  'application/x-7z-compressed': 'text-yellow-500',
  'application/x-tar': 'text-yellow-500',
  'application/gzip': 'text-yellow-500',
  
  // Code
  'text/html': 'text-teal-500',
  'text/css': 'text-teal-500',
  'text/javascript': 'text-teal-500',
  'application/json': 'text-teal-500',
  'text/xml': 'text-teal-500',
  'application/x-httpd-php': 'text-teal-500',
  'application/x-python-code': 'text-teal-500',
  'text/x-java': 'text-teal-500',
  
  // Executables
  'application/x-msdownload': 'text-red-600',
  'application/x-executable': 'text-red-600',
  'application/x-msdos-program': 'text-red-600',
  
  // Default
  'folder': 'text-amber-400',
  'default': 'text-gray-400'
};

// File type icon mapping
const fileTypeIcons = {
  // Documents
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📺',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📺',
  'text/plain': '📄',
  
  // Images
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/svg+xml': '🖼️',
  'image/webp': '🖼️',
  
  // Audio
  'audio/mpeg': '🎵',
  'audio/wav': '🎵',
  'audio/ogg': '🎵',
  'audio/midi': '🎵',
  
  // Video
  'video/mp4': '🎥',
  'video/webm': '🎥',
  'video/ogg': '🎥',
  'video/quicktime': '🎥',
  
  // Archives
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/x-tar': '📦',
  'application/gzip': '📦',
  
  // Code
  'text/html': '💻',
  'text/css': '💻',
  'text/javascript': '💻',
  'application/json': '💻',
  'text/xml': '💻',
  'application/x-httpd-php': '💻',
  'application/x-python-code': '💻',
  'text/x-java': '💻',
  
  // Executables
  'application/x-msdownload': '⚡',
  'application/x-executable': '⚡',
  'application/x-msdos-program': '⚡',
  
  // Default
  'folder': '📁',
  'default': '📄'
};

interface FileItemProps {
  file: FileItemType;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (e: MouseEvent) => void;
  onOpenContextMenu?: (file: FileItemType, e: MouseEvent) => void;
  onDoubleClick?: (file: FileItemType) => void;
}

export default function FileItem(props: FileItemProps) {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = createSignal(false);
  
  // Get the appropriate color and icon for the file type
  const getFileTypeColor = (file: FileItemType) => {
    if (file.isFolder) return fileTypeColors['folder'];
    return fileTypeColors[file.mimeType] || fileTypeColors['default'];
  };

  const getFileTypeIcon = (file: FileItemType) => {
    if (file.isFolder) return fileTypeIcons['folder'];
    return fileTypeIcons[file.mimeType] || fileTypeIcons['default'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleClick = (event: MouseEvent) => {
    if (props.isSelectable && props.onSelect) {
      event.stopPropagation();
      props.onSelect(event);
    }
  };
  
  const handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();
    
    if (props.onDoubleClick) {
      props.onDoubleClick(props.file);
      return;
    }
    
    // Default double-click behavior
    if (props.file.isFolder) {
      navigate(`/drive/${props.file.id}`);
    }
  };
  
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (props.onOpenContextMenu) {
      props.onOpenContextMenu(props.file, event);
    }
  };
  
  return (
    <div
      class={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200
        ${props.isSelected ? 'bg-primary/20' : 'hover:bg-primary/10'}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDblClick={handleDoubleClick}
      role="listitem"
      aria-selected={props.isSelected}
    >
      <div class="flex items-center flex-1 min-w-0">
        <div class={`mr-3 text-2xl ${getFileTypeColor(props.file)}`}>
          {getFileTypeIcon(props.file)}
      </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-text truncate" title={props.file.name}>
          {props.file.name}
        </div>
          <Show when={!props.file.isFolder}>
            <div class="text-xs text-text-muted">
              {formatFileSize(props.file.size)} • {formatDate(props.file.updatedAt)}
            </div>
          </Show>
        </div>
      </div>
      
      <Show when={isHovering() && !props.file.isInBin}>
        <div class="flex-shrink-0 flex items-center ml-2 text-text-muted space-x-1">
          <button 
            class="p-1.5 rounded-full hover:bg-background-light/40 hover:text-text transition-colors"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation();
              if (props.onOpenContextMenu) {
                props.onOpenContextMenu(props.file, e as unknown as MouseEvent);
              }
            }}
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </Show>
    </div>
  );
} 