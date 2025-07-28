import { createSignal, onCleanup } from 'solid-js';

export interface DragDropState {
  isDragOver: boolean;
  isDragging: boolean;
  files: File[];
}

export interface DragDropHandlers {
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  resetDragState: () => void;
  setFiles: (files: File[]) => void;
}

export function useDragDrop(onFilesDropped?: (files: File[]) => void) {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [isDragging, setIsDragging] = createSignal(false);
  const [files, setFiles] = createSignal<File[]>([]);
  
  let dragCounter = 0;

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter++;
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter--;
    
    if (dragCounter === 0) {
      setIsDragOver(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setIsDragging(false);
    dragCounter = 0;
    
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      onFilesDropped?.(droppedFiles);
    }
  };

  const resetDragState = () => {
    setIsDragOver(false);
    setIsDragging(false);
    setFiles([]);
    dragCounter = 0;
  };

  // Cleanup on unmount
  onCleanup(() => {
    resetDragState();
  });

  const state: DragDropState = {
    get isDragOver() { return isDragOver(); },
    get isDragging() { return isDragging(); },
    get files() { return files(); }
  };

  const handlers: DragDropHandlers = {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    resetDragState,
    setFiles
  };

  return { state, handlers };
}