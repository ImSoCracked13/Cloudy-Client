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
  const { uploadFiles, loading } = useUpload();
  const { fileExists } = useFilesList();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

  // Validate files before upload
  const validateFiles = (files: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of files) {
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
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      toastService.error('Total size exceeds 5GB limit');
      return [];
    }
    
    return validFiles;
  };

  // Handle file selection and upload
  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    
    if (files.length === 0) return;
    
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;
    
    try {
      const results = await uploadFiles(validFiles);
      const successCount = results.length;
      const failedCount = validFiles.length - successCount;
      
      if (successCount > 0) {
        toastService.success(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
        props.onUploadComplete?.();
      }
      
      if (failedCount > 0) {
        toastService.warning(`${failedCount} file${failedCount > 1 ? 's' : ''} failed to upload`);
      }
    } catch (error) {
      toastService.error('Upload failed');
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
        loading={loading()}
        disabled={loading()}
        onClick={handleButtonClick}
        class="!bg-blue-600 hover:!bg-blue-700"
      >
        Upload Files
      </Button>
    </div>
  );
}