import { For, createSignal, createEffect, Show } from 'solid-js';
import { FileItem as FileItemType } from '../types/fileType';
import FileItem from './FileItem';
import FileContextMenu from './FileContextMenu';
import Spinner from '../widgets/Spinner';

interface FileListProps {
  files: FileItemType[];
  folders?: FileItemType[]; // Make folders optional
  isLoading: boolean;
  currentPath: string;
  onFileClick: (file: FileItemType) => void;
  onFolderClick?: (folder: FileItemType) => void; // Add optional folder click handler
  onFileDelete: (file: FileItemType) => void;
  onFileRename: (file: FileItemType, newName: string) => void;
  onFileDuplicate?: (file: FileItemType) => void;
  onFilePreview?: (file: FileItemType) => void;
  onFileDownload: (file: FileItemType) => void;
  onFileProperties: (file: FileItemType) => void;
  onFileRestore?: (file: FileItemType) => void;
  onFileDeleteForever?: (file: FileItemType) => void;
  onContextMenu?: (item: FileItemType, e: MouseEvent) => void;
  selectedItems?: FileItemType[];
  onSelectItem?: (item: FileItemType, isMultiSelect: boolean) => void;
  isBin?: boolean; // Add optional isBin property
}

export default function FileList(props: FileListProps) {
  const [selectedFiles, setSelectedFiles] = createSignal<string[]>([]);
  const [contextMenu, setContextMenu] = createSignal<{
    file: FileItemType;
    position: { x: number; y: number };
  } | null>(null);
  
  // Get all items (files and folders)
  const allItems = () => {
    if (props.folders) {
      return [...(props.folders || []), ...props.files];
    }
    return props.files;
  };
  
  // Clear selection when files change
  createEffect(() => {
    // This will track the files prop
    props.files;
    props.folders;
    setSelectedFiles([]);
  });
  
  // Handle file click
  const handleItemClick = (item: FileItemType) => {
    if (item.isFolder && props.onFolderClick) {
      props.onFolderClick(item);
    } else {
      props.onFileClick(item);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (file: FileItemType, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const fileId = file.id;
    
    // Handle multiple selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      setSelectedFiles(prev => {
        if (prev.includes(fileId)) {
          return prev.filter(id => id !== fileId);
        } else {
          return [...prev, fileId];
        }
      });
    } 
    // Handle range selection with Shift key
    else if (e.shiftKey && selectedFiles().length > 0) {
      const fileIds = allItems().map(f => f.id);
      const lastSelectedIndex = fileIds.findIndex(id => id === selectedFiles()[selectedFiles().length - 1]);
      const currentIndex = fileIds.findIndex(id => id === fileId);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        const rangeSelection = fileIds.slice(start, end + 1);
        
        setSelectedFiles(prev => {
          const existing = new Set(prev);
          rangeSelection.forEach(id => existing.add(id));
          return Array.from(existing);
        });
      }
    } 
    // Single selection
    else {
      setSelectedFiles([fileId]);
    }
  };
  
  // Handle context menu
  const handleContextMenu = (file: FileItemType, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If the file is not already selected, select only this file
    if (!selectedFiles().includes(file.id)) {
      setSelectedFiles([file.id]);
    }
    
    setContextMenu({
      file,
      position: { x: e.clientX, y: e.clientY }
    });
    
    // If there's a parent context menu handler, call it
    if (props.onContextMenu) {
      props.onContextMenu(file, e);
    }
  };
  
  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSelectedFiles([]);
      closeContextMenu();
    }
    
    // Handle select all with Ctrl+A
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      setSelectedFiles(allItems().map(file => file.id));
    }
  };
  
  // Add keyboard event listener
  createEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  const itemsToDisplay = () => {
    // If we have separate folders, combine folders and files
    if (props.folders) {
      return [...props.folders, ...props.files];
    }
    return props.files;
  };
  
  return (
    <div class="w-full h-full">
      <Show
        when={!props.isLoading}
        fallback={
          <div class="flex flex-col items-center justify-center h-64">
            <Spinner size="lg" color="primary" label="Loading files..." />
          </div>
        }
      >
        <Show
          when={itemsToDisplay().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center h-64 text-text-muted">
              <svg class="h-16 w-16 mb-4 text-text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                />
              </svg>
              <p class="text-lg font-medium text-text">No files here yet</p>
              <p class="text-sm mt-1 text-text-muted">Upload files or create folders to get started</p>
            </div>
          }
        >
          <div 
            class="w-full space-y-1 pb-4" 
            role="list" 
            aria-label="Files and folders"
          >
            <For each={itemsToDisplay()}>
              {(item) => (
                <FileItem
                  file={item}
                  isSelectable={true}
                  isSelected={selectedFiles().includes(item.id)}
                  onSelect={(e) => handleFileSelect(item, e as MouseEvent)}
                  onOpenContextMenu={(f, e) => handleContextMenu(f, e)}
                  onDoubleClick={(f) => handleItemClick(f)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>
      
      {/* Context Menu */}
      <Show when={contextMenu()}>
        <FileContextMenu
          file={contextMenu()!.file}
          position={contextMenu()!.position}
          onClose={closeContextMenu}
          onReload={() => {
            props.onFileClick(contextMenu()!.file);
            closeContextMenu();
          }}
          onViewDetails={(file) => {
            props.onFileProperties(file);
            closeContextMenu();
          }}
          onPreview={(file) => {
            props.onFilePreview?.(file);
            closeContextMenu();
          }}
          onDownload={(file) => {
            props.onFileDownload(file);
            closeContextMenu();
          }}
          onRename={(newName) => {
            props.onFileRename(contextMenu()!.file, newName);
            closeContextMenu();
          }}
          onDuplicate={(file) => {
            props.onFileDuplicate?.(file);
            closeContextMenu();
          }}
          onDelete={(file) => {
            props.onFileDelete(file);
            closeContextMenu();
          }}
          onRestore={(file) => {
            props.onFileRestore?.(file);
            closeContextMenu();
          }}
          onDeleteForever={(file) => {
            props.onFileDeleteForever?.(file);
            closeContextMenu();
          }}
          isBin={props.isBin || props.currentPath === '/bin' || contextMenu()!.file.isInBin}
        />
      </Show>
    </div>
  );
} 