import { Component } from 'solid-js';
import { type FileItem } from '../../../handlers/FileHandler';

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
  
  // Video
  'video/mp4': '🎥',
  'video/webm': '🎥',
  'video/ogg': '🎥',
  
  // Archives
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/x-tar': '📦',
  'application/gzip': '📦',
  
  // Code
  'text/javascript': '📜',
  'text/typescript': '📜',
  'text/html': '📜',
  'text/css': '📜',
  'application/json': '📜',
  
  // Others
  'default': '📄'
};

interface FileItemProps {
  file: FileItem;
  onOpenContextMenu?: (file: FileItem, e: MouseEvent) => void;
  onDoubleClick?: (file: FileItem) => void;
}

const FileItemComponent: Component<FileItemProps> = (props) => {
  
  // Get icon for file type
  const getFileIcon = () => {
    return fileTypeIcons[props.file.mimeType] || fileTypeIcons['default'];
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();
    
    if (props.onDoubleClick) {
      props.onDoubleClick(props.file);
      return;
    }
    
  };
  
  return (
    <div
      class="relative group bg-background rounded-lg border border-background-light hover:border-primary cursor-pointer transition-colors duration-200"
      onContextMenu={(e) => props.onOpenContextMenu?.(props.file, e)}
      onDblClick={(e) => handleDoubleClick(e)}
    >
      <div class="p-4">
        <div class="flex items-center gap-3">
          <div class="text-2xl">{getFileIcon()}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium truncate" title={props.file.name}>
              {props.file.name}
            </h3>
            {(
              <p class="text-xs text-text-muted">
                {formatFileSize(props.file.size || 0)}
              </p>
            )}
            <p class="text-xs text-text-muted">
              {formatDate(props.file.modifiedAt || props.file.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileItemComponent; 