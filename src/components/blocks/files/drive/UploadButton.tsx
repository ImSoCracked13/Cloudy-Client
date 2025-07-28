import { createSignal, Show } from 'solid-js';
import { useUpload } from '../../../hooks/files/drive/useUpload';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import Button from '../../../widgets/Button';
import UploadBar from './UploadBar';
import UploadLimitChecker from './UploadLimitChecker';
import SameNameChecker from './SameNameChecker';

interface UploadButtonProps {
  currentFolderId: string | null;
  onClose: () => void;
  onUploadComplete?: () => void;
  class?: string;
}

export default function UploadButton(props: UploadButtonProps) {
  const { loading: uploadLoading, clearAllUploads } = useUpload();
  const { fileExists } = useFilesList();

  const [files, setFiles] = createSignal<File[]>([]);
  const [showUploadDialog, setShowUploadDialog] = createSignal(false);

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
  }

  // Handle file selection and size validation
  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFiles = Array.from(input.files);
      const validFiles = [];
      const oversized = [];
      const duplicates = [];
      
      // Check each file's size and name conflicts
      for (const file of selectedFiles) {
        if (file.size > sizeLimit) {
          oversized.push(file);
        } else if (fileExists(file.name)) {
          duplicates.push(file);
        } else {
          validFiles.push(file);
        }
      }
      
      setFiles(selectedFiles);
      
      // Show duplicate files dialog if any duplicates found
      if (duplicates.length > 0) {
        setDuplicateFiles(duplicates);
        setShowSameFileDialog(true);
      }
      
      // Show size limit warning if any oversized files
      if (oversized.length > 0) {
        setOversizedFiles(oversized);
        setShowSizeLimitDialog(true);

        // Only proceed with valid files if there are any
        if (validFiles.length > 0) {
          setPendingFiles(validFiles);
          setShowUploadDialog(true);
        }
      } else if (validFiles.length > 0) {
        setPendingFiles(validFiles);
        setShowUploadDialog(true);
      }

      // Check storage limit
      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > storageLimit) {
        setStorageLimitExceeded(true);
      }
    }
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    props.onUploadComplete?.();
  };
  
  const uploadIcon = (
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
  
  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any previous uploads before starting new ones
    clearAllUploads();
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Reset input to allow selecting same file again
      fileInput.click();
    }
  };
  
  return (
    <>
      <div class="relative">
        <input
          type="file"
          id="file-upload"
          multiple
          class="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="primary"
          leftIcon={uploadIcon}
          loading={uploadLoading()}
          disabled={uploadLoading()}
          onClick={handleButtonClick}
          class="!bg-blue-600 hover:!bg-blue-700"
        >
          Upload Files
        </Button>
      </div>

      {/* Show size limit warning for oversized files */}
      <Show when={showSizeLimitDialog()}>
        <UploadLimitChecker
          isOpen={showSizeLimitDialog()}
          files={oversizedFiles()}
          currentFolderId={props.currentFolderId}
          onClose={() => setShowSizeLimitDialog(false)}
        />
      </Show>

      {/* Show storage limit exceeded warning */}
      <Show when={storageLimitExceeded()}>
        <UploadLimitChecker
          files={[]}
          isOpen={storageLimitExceeded()}
          currentFolderId={props.currentFolderId}
          onClose={() => setStorageLimitExceeded(false)}
        />
      </Show>

      {/* Show same file name warning */}
      <Show when={showSameFileDialog()}>
        <SameNameChecker
          isOpen={showSameFileDialog()}
          files={duplicateFiles()}
          currentFolderId={props.currentFolderId}
          onClose={() => setShowSameFileDialog(false)}
        />
      </Show>

      {/* Show upload dialog for valid files */}
      <Show when={showUploadDialog()}>
        <UploadBar
          isOpen={showUploadDialog()}
          files={pendingFiles()}
          currentFolderId={props.currentFolderId}
          onClose={() => {
            setShowUploadDialog(false);
            handleUploadComplete();
          }}
          onUploadComplete={handleUploadComplete}
        />
      </Show>
    </>
  );
}