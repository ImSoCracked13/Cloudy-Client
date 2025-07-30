import { useUpload } from '../../../hooks/files/drive/useUpload';
import { useFilesList } from '../../../hooks/files/joints/useFilesList';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface UploadButtonProps {
  onClose: () => void;
  onUploadComplete?: () => void;
  class?: string;
}

export default function UploadButton(props: UploadButtonProps) {
  const { loading: uploadLoading, clearAllUploads, startUploads, addToUploadQueue } = useUpload();
  const { fileExists } = useFilesList();

  const sizeLimit = 25 * 1024 * 1024; // 25MB
  const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection and validation with toast messages
  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFiles = Array.from(input.files);
      const validFiles: File[] = [];
      
      // Check each file's size, storage limit, and name conflicts
      for (const file of selectedFiles) {
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
        
        // Proceed with upload
        try {
          addToUploadQueue(validFiles);
          await startUploads();
          toastService.success(`Uploaded ${validFiles.length} file${validFiles.length > 1 ? 's' : ''} successfully`);
          props.onUploadComplete?.();
        } catch (error) {
          toastService.error('Failed to upload files');
        }
      }
    }
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
  );
}