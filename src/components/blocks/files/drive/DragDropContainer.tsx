import { JSX, Show } from 'solid-js';
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
    const { uploadFiles } = useUpload();

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

    // Validate files before upload
    const validateFiles = (files: File[]) => {
        // Filter out directories and invalid files
        const actualFiles = files.filter(file => {
            // Check if it's a valid file (not a directory)
            if (file.type === '' && file.size === 0) {
                toastService.warning(`Skipping directory: ${file.name}`);
                return false;
            }
            
            // Check if file has a valid name
            if (!file.name || file.name.trim() === '') {
                toastService.warning(`Skipping invalid file: ${file.name}`);
                return false;
            }
            
            // Additional check for webkit relative path (folder drops)
            if ((file as any).webkitRelativePath && (file as any).webkitRelativePath !== '') {
                toastService.warning(`Skipping folder: ${file.name}`);
                return false;
            }
            
            return file instanceof File;
        });

        if (actualFiles.length === 0) {
            toastService.error('No valid files found. Directories are not supported.');
            return [];
        }

        const validFiles: File[] = [];
        
        for (const file of actualFiles) {
            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                toastService.warning(`"${file.name}" is too large (max 25MB)`);
                continue;
            }
            
            // Check for duplicates
            if (fileExists(file.name)) {
                toastService.warning(`"${file.name}" already exists`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        // Check total size
        if (validFiles.length > 0) {
            const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
            if (totalSize > MAX_TOTAL_SIZE) {
                toastService.error('Total size exceeds 5GB limit');
                return [];
            }
        }
        
        return validFiles;
    };

    // Handle file upload
    const handleUpload = async (files: File[]) => {
        const validFiles = validateFiles(files);
        if (validFiles.length === 0) return;
        
        try {
            const results = await uploadFiles(validFiles);
            const successCount = results.length;
            const failedCount = validFiles.length - successCount;
            
            if (successCount > 0) {
                toastService.success(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
                handlers.resetDragState();
            }
            
            if (failedCount > 0) {
                toastService.warning(`${failedCount} file${failedCount > 1 ? 's' : ''} failed`);
            }
        } catch (error) {
            toastService.error('Upload failed');
        }
    };

    const { state, handlers } = useDragDrop((files) => {
        if (!props.disabled) {
            props.onFilesSelected?.(files);
            handleUpload(files);
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