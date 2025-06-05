import { createSignal } from 'solid-js';
import { notificationService } from '../common/Notification';
import { formatFileSize } from '../common/formatFileSize';

export interface DragDropOptions {
  maxFileSize?: number;
  maxFiles?: number;
  allowedFileTypes?: string[];
  onDrop?: (files: File[]) => void;
}

export function useDragDrop(options: DragDropOptions = {}) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [validationError, setValidationError] = createSignal<string | null>(null);
  
  const validateFiles = (files: File[]): { valid: boolean; message?: string } => {
    // Check if files exist
    if (!files.length) {
      return { valid: false, message: 'No files were selected' };
    }
    
    // Check max files limit
    if (options.maxFiles && files.length > options.maxFiles) {
      return { 
        valid: false, 
        message: `Too many files. Maximum ${options.maxFiles} ${options.maxFiles === 1 ? 'file' : 'files'} allowed` 
      };
    }
    
    // Check file types if specified
    if (options.allowedFileTypes && options.allowedFileTypes.length > 0) {
      const invalidFiles = files.filter(file => {
        // Check if the file type matches any of the allowed types
        return !options.allowedFileTypes!.some(type => {
          // Handle both exact matches and wildcards (e.g., "image/*")
          if (type.endsWith('/*')) {
            const mainType = type.split('/')[0];
            return file.type.startsWith(mainType + '/');
          }
          return file.type === type;
        });
      });
      
      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map(f => f.name).join(', ');
        const allowedTypes = options.allowedFileTypes.join(', ');
        return { 
          valid: false, 
          message: `Invalid file type${invalidFiles.length > 1 ? 's' : ''}: ${fileNames}. Allowed types: ${allowedTypes}` 
        };
      }
    }
    
    // Check file size
    if (options.maxFileSize) {
      const oversizedFiles = files.filter(file => file.size > options.maxFileSize!);
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ');
        return { 
          valid: false, 
          message: `File${oversizedFiles.length > 1 ? 's' : ''} too large: ${fileNames}. Maximum size: ${formatFileSize(options.maxFileSize)}` 
        };
      }
    }
    
    return { valid: true };
  };
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    setIsDragging(true);
  };
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    // Ensure dragging state is maintained
    if (!isDragging()) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop target
    // and not entering a child element
    if (e.currentTarget && e.relatedTarget) {
      const currentTarget = e.currentTarget as Node;
      const relatedTarget = e.relatedTarget as Node;
      
      // Check if the related target is not a child of the current target
      if (!currentTarget.contains(relatedTarget)) {
        setIsDragging(false);
      }
    } else {
      // Fallback for browsers that don't support relatedTarget
      setIsDragging(false);
    }
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!e.dataTransfer) {
      return;
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Validate files
    const validation = validateFiles(droppedFiles);
    if (!validation.valid) {
      setValidationError(validation.message || 'Invalid files');
      notificationService.error(validation.message || 'Invalid files');
      return;
    }
    
    // Clear any previous validation errors
    clearValidationError();
    
    // Call the onDrop callback if provided
    if (options.onDrop) {
      options.onDrop(droppedFiles);
    }
  };
  
  const clearValidationError = () => {
    setValidationError(null);
  };
  
  return {
    isDragging,
    validationError,
    clearValidationError,
    bindDragEvents: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
} 