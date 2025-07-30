import { JSX, Show, createSignal } from 'solid-js';
import { useDragDrop } from '../../../hooks/files/drive/useDragDrop';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import { useUpload } from '../../../hooks/files/drive/useUpload';
import toastService from '../../../common/Notification';


interface DragDropContainerProps {
    children: JSX.Element;
    onFilesSelected?: (files: File[]) => void;
    disabled?: boolean;
    class?: string;
}

export default function DragDropContainer(props: DragDropContainerProps) {
    const { fileExists } = useFilesList();
    const { addToUploadQueue, startUploads } = useUpload();

    const sizeLimit = 25 * 1024 * 1024; // 25MB
    const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Validate files before upload with toast messages
    const validateAndProcessFiles = async (files: File[]) => {
        // Filter out directories and invalid files
        const actualFiles = files.filter(file => {
            // Check if it's a valid file (not a directory)
            if (file.type === '' && file.size === 0) {
                toastService.warning(`Skipping directory or invalid file: ${file.name}`);
                return false;
            }
            
            // Check if file has a valid name
            if (!file.name || file.name.trim() === '') {
                toastService.warning(`Skipping file with invalid name: ${file.name}`);
                return false;
            }
            
            // Additional check for webkit relative path (folder drops)
            if ((file as any).webkitRelativePath && (file as any).webkitRelativePath !== '') {
                toastService.warning(`Skipping folder drop: ${file.name}`);
                return false;
            }
            
            // Ensure it's actually a File object
            if (!(file instanceof File)) {
                toastService.warning(`Skipping non-file item: ${file}`);
                return false;
            }
            
            return true;
        });

        if (actualFiles.length === 0) {
            toastService.error('No valid files found. Directories and folders are not supported.');
            return;
        }

        const validFiles: File[] = [];
        
        // Check each file's size, storage limit, and name conflicts
        for (const file of actualFiles) {
            // Check file size limit (25MB)
            if (file.size > sizeLimit) {
                toastService.warning(`File "${file.name}" exceeds 25MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`);
                continue;
            }
            
            // Check for duplicate names
            if (fileExists(file.name)) {
                toastService.warning(`A file named "${file.name}" already exists. Please rename the file or choose a different one.`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        // Check total storage limit
        if (validFiles.length > 0) {
            const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
            if (totalSize > storageLimit) {
                toastService.error(`Total file size (${formatFileSize(totalSize)}) exceeds 5GB storage limit. Please remove some files.`);
                return;
            }
            
            // Proceed with valid files
            try {
                addToUploadQueue(validFiles);
                await startUploads();
                toastService.success(`Uploaded ${validFiles.length} file${validFiles.length > 1 ? 's' : ''} successfully`);
                handlers.resetDragState();
            } catch (error) {
                toastService.error('Failed to upload files');
            }
        }
    };

    const { state, handlers } = useDragDrop((files) => {
        if (!props.disabled) {
        props.onFilesSelected?.(files);
        validateAndProcessFiles(files);
        }
    });

    return (
        <div
        class={`relative w-full h-full ${props.class || ''}`}
        onDragEnter={handlers.handleDragEnter}
        onDragLeave={handlers.handleDragLeave}
        onDragOver={handlers.handleDragOver}
        onDrop={handlers.handleDrop}
        >
        {/* Main content */}
        {props.children}

        {/* Drag overlay */}
        <Show when={state.isDragOver && !props.disabled}>
            <div class="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="text-center">
                <div class="text-4xl mb-4">📁</div>
                <h3 class="text-xl font-semibold text-primary mb-2">Drop files here</h3>
                <p class="text-text-muted">Release to upload files</p>
            </div>
            </div>
        </Show>
    </div>
);
}