import { createSignal, Show, onCleanup, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { FileItem } from '../types/file';
import { fileService } from '../services/fileService';

interface FileContextMenuProps {
  file: FileItem | null;
  position: { x: number; y: number };
  onClose: () => void;
  onReload: () => void;
  onViewDetails?: (file: FileItem) => void;
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onRename?: (newName: string) => void;
  onDuplicate?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onDeleteForever?: (file: FileItem) => void;
  onAction?: (action: string, file: FileItem) => void;
  isBin?: boolean;
}

export default function FileContextMenu(props: FileContextMenuProps) {
  let menuRef: HTMLDivElement | undefined;
  const [menuPosition, setMenuPosition] = createSignal(adjustPosition(props.position));
  
  // Adjust menu position to ensure it's fully visible
  function adjustPosition(pos: { x: number; y: number }) {
    const x = pos.x;
    const y = pos.y;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 220; // approximate menu width
    const menuHeight = 350; // approximate menu height
    
    // Adjust position if near screen edges
    const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : x;
    const adjustedY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : y;
    
    return { x: adjustedX, y: adjustedY };
  }
  
  // Handle click outside to close menu
  function handleClickOutside(e: MouseEvent) {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      props.onClose();
    }
  }
  
  // Handle keyboard events
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      props.onClose();
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    // Adjust position once menu is rendered
    if (menuRef) {
      const rect = menuRef.getBoundingClientRect();
      setMenuPosition(adjustPosition({
        x: props.position.x,
        y: props.position.y
      }));
    }
  });
  
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  const handleAction = (action: string) => {
    if (!props.file) return;
    
    if (props.onAction) {
      props.onAction(action, props.file);
    } else {
      // Direct action handlers
      switch (action) {
        case 'view':
          props.onViewDetails?.(props.file);
          break;
        case 'preview':
          props.onPreview?.(props.file);
          break;
        case 'download':
          props.onDownload?.(props.file);
          break;
        case 'rename':
          // For rename, we don't close immediately since the rename dialog needs to open
          if (props.onRename) {
            const newName = window.prompt('Enter new name:', props.file.name);
            if (newName && newName !== props.file.name) {
              props.onRename(newName);
            }
          }
          break;
        case 'duplicate':
          props.onDuplicate?.(props.file);
          break;
        case 'delete':
          props.onDelete?.(props.file);
          break;
        case 'restore':
          props.onRestore?.(props.file);
          break;
        case 'deleteForever':
          if (confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
            props.onDeleteForever?.(props.file);
          }
          break;
      }
    }
    
    // Close menu after action (except for rename which has its own flow)
    if (action !== 'rename') {
      props.onClose();
    }
  };
  
  return (
    <Portal>
      <div
        ref={menuRef}
        class="fixed z-50 bg-background-darker shadow-lg rounded-md overflow-hidden border border-background-light min-w-[200px]"
        style={{
          left: `${menuPosition().x}px`,
          top: `${menuPosition().y}px`
        }}
      >
        <div class="py-1">
          <Show when={!props.isBin}>
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
              onClick={() => handleAction('preview')}
              disabled={!props.onPreview}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
              onClick={() => handleAction('download')}
              disabled={!props.onDownload}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
              onClick={() => handleAction('rename')}
              disabled={!props.onRename}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
              onClick={() => handleAction('duplicate')}
              disabled={!props.onDuplicate}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Duplicate
            </button>
            
            <div class="border-t border-background-light my-1"></div>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-danger"
              onClick={() => handleAction('delete')}
              disabled={!props.onDelete}
            >
              <svg class="w-5 h-5 text-danger-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Move to Bin
            </button>
          </Show>
          
          <Show when={props.isBin}>
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
              onClick={() => handleAction('restore')}
              disabled={!props.onRestore}
            >
              <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Restore
            </button>
            
            <button
              class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-danger"
              onClick={() => handleAction('deleteForever')}
              disabled={!props.onDeleteForever}
            >
              <svg class="w-5 h-5 text-danger-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Forever
            </button>
          </Show>
          
          <div class="border-t border-background-light my-1"></div>
          
          <button
            class="w-full px-4 py-2 text-left hover:bg-background-light flex items-center gap-2 text-text"
            onClick={() => handleAction('view')}
            disabled={!props.onViewDetails}
          >
            <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Properties
          </button>
        </div>
      </div>
    </Portal>
  );
} 