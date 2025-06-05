import { createSignal } from 'solid-js';

interface DragDropOptions {
  onDrop?: (files: File[]) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[]; // MIME types
}

export function useDragDrop(options: DragDropOptions = {}) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragCounter, setDragCounter] = createSignal(0);
  const [validationError, setValidationError] = createSignal<string | null>(null);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
    
    // Clear any previous validation errors when a new drag operation starts
    setValidationError(null);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging()) {
      setIsDragging(true);
    }
    
    if (options.onDragOver) {
      options.onDragOver(e);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev - 1);
    
    if (dragCounter() === 0) {
      setIsDragging(false);
    }
    
    if (options.onDragLeave) {
      options.onDragLeave(e);
    }
  };

  const validateFiles = (files: File[]): { valid: File[], invalid: File[], error: string | null } => {
    const valid: File[] = [];
    const invalid: File[] = [];
    let error: string | null = null;
    
    // Validate each file
    for (const file of files) {
      let isValid = true;
      
      // Check file size if maxFileSize is specified
      if (options.maxFileSize && file.size > options.maxFileSize) {
        isValid = false;
        error = `File size exceeds the ${formatFileSize(options.maxFileSize)} limit`;
      }
      
      // Check file type if allowedFileTypes is specified
      if (options.allowedFileTypes && options.allowedFileTypes.length > 0) {
        const fileType = file.type.toLowerCase();
        if (!options.allowedFileTypes.some(type => fileType.includes(type.toLowerCase()))) {
          isValid = false;
          error = 'File type not allowed';
        }
      }
      
      if (isValid) {
        valid.push(file);
      } else {
        invalid.push(file);
      }
    }
    
    return { valid, invalid, error };
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    
    const files: File[] = [];
    
    if (e.dataTransfer?.items) {
      // Use DataTransferItemList interface
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    } else if (e.dataTransfer?.files) {
      // Use DataTransfer interface
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }
    
    if (files.length > 0) {
      const { valid, invalid, error } = validateFiles(files);
      
      if (error) {
        setValidationError(error);
      }
      
      if (valid.length > 0 && options.onDrop) {
        options.onDrop(valid);
      }
    }
  };

  const bindDragEvents = (element: HTMLElement) => {
    element.addEventListener('dragenter', handleDragEnter as EventListener);
    element.addEventListener('dragover', handleDragOver as EventListener);
    element.addEventListener('dragleave', handleDragLeave as EventListener);
    element.addEventListener('drop', handleDrop as EventListener);
    
    return () => {
      element.removeEventListener('dragenter', handleDragEnter as EventListener);
      element.removeEventListener('dragover', handleDragOver as EventListener);
      element.removeEventListener('dragleave', handleDragLeave as EventListener);
      element.removeEventListener('drop', handleDrop as EventListener);
    };
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isDragging,
    bindDragEvents,
    validationError,
    clearValidationError: () => setValidationError(null),
  };
}