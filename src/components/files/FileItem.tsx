import { JSX } from 'solid-js';
import { FileItem as FileItemType } from '../types/file';
import { formatFileSize } from '../utilities/formatFileSize';
import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

interface FileItemProps {
  file: FileItemType;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (e: MouseEvent) => void;
  onOpenContextMenu?: (file: FileItemType, event: MouseEvent) => void;
  onDoubleClick?: (file: FileItemType) => void;
}

export default function FileItem(props: FileItemProps) {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = createSignal(false);
  
  const getFileIcon = () => {
    switch (props.file.type) {
      case 'folder':
        return (
          <svg class="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg class="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'presentation':
        return (
          <svg class="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg class="h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
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
    
    if (props.onOpenContextMenu) {
      props.onOpenContextMenu(props.file, event);
    }
  };
  
  return (
    <div
      class={`file-item ${props.isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
      role="listitem"
      aria-label={props.file.name}
      aria-selected={props.isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDoubleClick(e as unknown as MouseEvent);
        }
      }}
    >
      <div class="file-icon">
        {getFileIcon()}
      </div>
      
      <div class="flex-grow min-w-0">
        <div class="text-sm font-medium truncate">
          {props.file.name}
        </div>
        
        <div class="text-xs text-text-muted mt-1 flex space-x-2">
          <span>{formatFileSize(props.file.size)}</span>
          <span>•</span>
          <span>{formatDate(props.file.updatedAt)}</span>
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