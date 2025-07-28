import { JSX, Show, createSignal } from 'solid-js';
import { useDragDrop } from '../../../hooks/files/drive/useDragDrop';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import UploadBar from './UploadBar';
import UploadLimitChecker from './UploadLimitChecker';
import SameNameChecker from './SameNameChecker';
import toastService from '../../../common/Notification';


interface DragDropContainerProps {
    children: JSX.Element;
    onFilesSelected?: (files: File[]) => void;
    disabled?: boolean;
    class?: string;
    parentId?: string | null;
}

export default function DragDropContainer(props: DragDropContainerProps) {
    const { fileExists } = useFilesList();
    const [showUploadBar, setShowUploadBar] = createSignal(false);

    const [droppedFiles, setDroppedFiles] = createSignal<File[]>([]);
    const [pendingFiles, setPendingFiles] = createSignal<File[]>([]);

    const [showSizeLimitDialog, setShowSizeLimitDialog] = createSignal(false);
    const [oversizedFiles, setOversizedFiles] = createSignal<File[]>([]);

    const [storageLimitExceeded, setStorageLimitExceeded] = createSignal(false);
    const [showSameFileDialog, setShowSameFileDialog] = createSignal(false);

    const [duplicateFiles, setDuplicateFiles] = createSignal<File[]>([]);

    const sizeLimit = 25 * 1024 * 1024; // 25MB
    const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB

  // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

  // Validate files before upload
    const validateAndProcessFiles = (files: File[]) => {
        // Filter out directories and invalid files
        const actualFiles = files.filter(file => {
            
            // Warn the some file types are not supported
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                toastService.warning(`Drag Drop does not support DOCX file: ${file.name}`);
                return false;
            }

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
            toastService.error('This file is not valid. Directories and folders are not supported.');
            return;
        }

        const validFiles = [];
        const oversized = [];
        const duplicates = [];
        
        // Check each file's size and name conflicts
        for (const file of actualFiles) {
            if (file.size > sizeLimit) {
                oversized.push(file);
            } else if (fileExists(file.name)) {
                duplicates.push(file);
            } else {
                validFiles.push(file);
            }
        }
        
        setDroppedFiles(actualFiles); // Store all dropped files for reference
        
        // Show duplicate files dialog if any duplicates found
        if (duplicates.length > 0) {
            setDuplicateFiles(duplicates);
            setShowSameFileDialog(true);
        }
        
        if (oversized.length > 0) {
            setOversizedFiles(oversized);
            setShowSizeLimitDialog(true);
            // Only proceed with valid files if there are any
            if (validFiles.length > 0) {
                setPendingFiles(validFiles);
                setShowUploadBar(true);
            }
        } else if (validFiles.length > 0) {
            setPendingFiles(validFiles);
            setShowUploadBar(true);
        }

        // Check storage limit
        const totalSize = actualFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > storageLimit) {
            setStorageLimitExceeded(true);
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

        {/* UploadBar modal/dialog */}
        <Show when={showUploadBar() && pendingFiles().length > 0}>
            <UploadBar
            isOpen={showUploadBar()}
            onClose={() => {
                setShowUploadBar(false);
                setDroppedFiles([]);
                setPendingFiles([]);
                handlers.resetDragState();
            }}
            files={pendingFiles()}
            currentFolderId={props.parentId ?? null}
            onUploadComplete={() => {
                setShowUploadBar(false);
                setDroppedFiles([]);
                setPendingFiles([]);
                handlers.resetDragState();
            }}
            />
        </Show>

        {/* Size limit dialog */}
        <Show when={showSizeLimitDialog()}>
            <UploadLimitChecker
            isOpen={showSizeLimitDialog()}
            onClose={() => setShowSizeLimitDialog(false)}
            files={oversizedFiles()}
            currentFolderId={props.parentId ?? null}
            />
        </Show>

        {/* Storage limit exceeded warning */}
        <Show when={storageLimitExceeded()}>
            <UploadLimitChecker
            isOpen={storageLimitExceeded()}
            onClose={() => setStorageLimitExceeded(false)}
            files={[]}
            currentFolderId={props.parentId ?? null}
            />
        </Show>

        {/* Same file name warning */}
        <Show when={showSameFileDialog()}>
            <SameNameChecker
            isOpen={showSameFileDialog()}
            files={duplicateFiles()}
            currentFolderId={props.parentId ?? null}
            onClose={() => setShowSameFileDialog(false)}
            />
        </Show>
    </div>
);
}