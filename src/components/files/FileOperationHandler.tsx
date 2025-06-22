import { Component, createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { FileItem } from '../types/fileType';
import { storageSynchronizer } from '../utilities/storageSynchronizer';
import { notificationService } from '../common/Notification';
import Loading from '../common/Loading';

export type FileOperation = 
  | { type: 'rename'; file: FileItem; newName: string }
  | { type: 'move'; file: FileItem; destinationFolderId: string | null }
  | { type: 'duplicate'; file: FileItem }
  | { type: 'delete'; file: FileItem }
  | { type: 'restore'; file: FileItem }
  | { type: 'deleteForever'; file: FileItem };

interface FileOperationHandlerProps {
  operation: FileOperation;
  onComplete: (success: boolean, updatedFile?: FileItem) => void;
  onCancel: () => void;
}

const FileOperationHandler: Component<FileOperationHandlerProps> = (props) => {
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [progress, setProgress] = createSignal(0);
  
  // Start the operation immediately
  createEffect(() => {
    if (props.operation) {
      executeOperation();
    }
  });
  
  // Cleanup any ongoing operations
  onCleanup(() => {
    // Any cleanup needed
  });
  
  const executeOperation = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const operation = props.operation;
      let result: FileItem | boolean | null = null;
      
      // Start progress animation
      const progressInterval = startProgressAnimation();
      
      switch (operation.type) {
        case 'rename':
          result = await storageSynchronizer.renameFile(operation.file, operation.newName);
          break;
          
        case 'move':
          result = await storageSynchronizer.moveFile(operation.file, operation.destinationFolderId);
          break;
          
        case 'duplicate':
          result = await storageSynchronizer.duplicateFile(operation.file);
          break;
          
        case 'delete':
          result = await storageSynchronizer.moveToTrash(operation.file);
          break;
          
        case 'restore':
          result = await storageSynchronizer.restoreFromTrash(operation.file);
          break;
          
        case 'deleteForever':
          result = await storageSynchronizer.deleteFile(operation.file);
          break;
      }
      
      // Clear progress animation
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!result) {
        throw new Error(`Failed to ${operation.type} ${operation.file.name}`);
      }
      
      // Display success message
      const successMessage = getSuccessMessage(operation);
      notificationService.success(successMessage);
      
      // Delay completion to show 100% progress
      setTimeout(() => {
        props.onComplete(true, result as FileItem);
      }, 500);
      
    } catch (err) {
      console.error('Error executing file operation:', err);
      setError(err instanceof Error ? err.message : 'Operation failed');
      setProgress(0);
      
      // Display error message
      notificationService.error(err instanceof Error ? err.message : 'Operation failed');
      
      // Complete with failure
      props.onComplete(false);
    } finally {
      setLoading(false);
    }
  };
  
  const startProgressAnimation = () => {
    // Create a realistic progress animation for better UX
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 5;
      if (currentProgress > 90) {
        currentProgress = 90; // Cap at 90% until we know it's done
        clearInterval(interval);
      }
      setProgress(Math.min(90, currentProgress));
    }, 150);
    
    return interval;
  };
  
  const getSuccessMessage = (operation: FileOperation): string => {
    switch (operation.type) {
      case 'rename':
        return `"${operation.file.name}" renamed to "${operation.newName}"`;
      case 'move':
        return `"${operation.file.name}" moved successfully`;
      case 'duplicate':
        return `"${operation.file.name}" duplicated successfully`;
      case 'delete':
        return `"${operation.file.name}" moved to trash`;
      case 'restore':
        return `"${operation.file.name}" restored from trash`;
      case 'deleteForever':
        return `"${operation.file.name}" permanently deleted`;
      default:
        return 'Operation completed successfully';
    }
  };
  
  const getOperationText = (): string => {
    const operation = props.operation;
    
    switch (operation.type) {
      case 'rename':
        return `Renaming "${operation.file.name}" to "${operation.newName}"`;
      case 'move':
        return `Moving "${operation.file.name}"`;
      case 'duplicate':
        return `Duplicating "${operation.file.name}"`;
      case 'delete':
        return `Moving "${operation.file.name}" to trash`;
      case 'restore':
        return `Restoring "${operation.file.name}" from trash`;
      case 'deleteForever':
        return `Permanently deleting "${operation.file.name}"`;
      default:
        return 'Processing operation...';
    }
  };
  
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay backdrop-blur-sm">
      <div class="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-medium text-text mb-4">{getOperationText()}</h2>
        
        <div class="mb-6">
          <div class="w-full bg-background-lighter h-2 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progress()}%` }}
            ></div>
          </div>
          <div class="flex justify-between mt-2 text-sm text-text-muted">
            <span>{progress().toFixed(0)}%</span>
            <span>
              {loading() ? 'Processing...' : (error() ? 'Failed' : 'Complete')}
            </span>
          </div>
        </div>
        
        <Show when={error()}>
          <div class="bg-error bg-opacity-10 p-3 rounded-md text-error mb-4">
            {error()}
          </div>
        </Show>
        
        <div class="flex justify-end space-x-3">
          <Show when={loading()}>
            <button 
              onClick={props.onCancel}
              class="px-4 py-2 rounded-md bg-background-light text-text hover:bg-background-lighter transition-colors"
              disabled={progress() > 90}
            >
              Cancel
            </button>
          </Show>
          
          <Show when={!loading() || error()}>
            <button 
              onClick={() => props.onComplete(false)}
              class="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Close
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default FileOperationHandler;