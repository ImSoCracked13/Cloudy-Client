export type FileType = 
  'folder' | 
  'image' | 
  'document' | 
  'spreadsheet' | 
  'presentation' | 
  'pdf' | 
  'video' | 
  'audio' | 
  'archive' | 
  'code' |
  'text' |
  'excel' |
  'word' |
  'powerpoint' |
  'zip' |
  'rar' |
  'other';

export const FILE_EXTENSIONS: Record<string, FileType> = {
  // Images
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'svg': 'image',
  'webp': 'image',
  'bmp': 'image',
  'ico': 'image',
  
  // Documents
  'doc': 'word',
  'docx': 'word',
  'rtf': 'document',
  'txt': 'text',
  'md': 'text',
  
  // Spreadsheets
  'xls': 'excel',
  'xlsx': 'excel',
  'csv': 'spreadsheet',
  
  // Presentations
  'ppt': 'powerpoint',
  'pptx': 'powerpoint',
  
  // PDFs
  'pdf': 'pdf',
  
  // Videos
  'mp4': 'video',
  'webm': 'video',
  'mov': 'video',
  'avi': 'video',
  'mkv': 'video',
  
  // Audio
  'mp3': 'audio',
  'wav': 'audio',
  'ogg': 'audio',
  'flac': 'audio',
  
  // Archives
  'zip': 'zip',
  'rar': 'rar',
  '7z': 'archive',
  'tar': 'archive',
  'gz': 'archive',
  
  // Code
  'js': 'code',
  'ts': 'code',
  'jsx': 'code',
  'tsx': 'code',
  'html': 'code',
  'css': 'code',
  'json': 'code',
  'py': 'code',
  'java': 'code',
  'c': 'code',
  'cpp': 'code',
  'php': 'code',
  'go': 'code',
  'rs': 'code',
  'rb': 'code'
};

export function getFileType(fileName: string, mimeType?: string): FileType {
  // Handle folder type
  if (mimeType === 'application/x-directory') {
    return 'folder';
  }
  
  // Try to determine by mime type first
  if (mimeType) {
    const mainType = mimeType.split('/')[0];
    
    switch (mainType) {
      case 'image': return 'image';
      case 'video': return 'video';
      case 'audio': return 'audio';
      case 'text': return mimeType.includes('code') ? 'code' : 'text';
      case 'application': {
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('zip')) return 'zip';
        if (mimeType.includes('rar')) return 'rar';
        if (mimeType.includes('compressed') && !mimeType.includes('zip') && !mimeType.includes('rar')) return 'archive';
        if (mimeType.includes('msword') || mimeType.includes('wordprocessing') || 
            mimeType.includes('document') && mimeType.includes('word')) return 'word';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'powerpoint';
        if (mimeType.includes('document') && !mimeType.includes('word')) return 'document';
      }
    }
  }
  
  // Fallback to extension-based detection
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension && FILE_EXTENSIONS[extension]) {
    return FILE_EXTENSIONS[extension];
  }
  
  // Default to 'other' if no match found
  return 'other';
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  isFolder: boolean;
  isShared: boolean;
  shareLink?: string;
  sharedWith?: string[];
  thumbnailUrl?: string;
  contentType?: string;
  extension?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  mimeType?: string;
  isInBin?: boolean;
  objectPath?: string;
  objectName?: string;
  ownerId?: string;
  isPublic?: boolean;
  location?: string;
}

export interface FolderContents {
  id: string;
  name: string;
  path: string;
  files: FileItem[];
  folders: FileItem[];
  parentId: string | null;
  breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
  id: string;
  name: string;
  path: string;
}

export interface FileUploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileSortOptions {
  sortBy: 'name' | 'size' | 'modified';
  direction: 'asc' | 'desc';
}

export interface FileSearchResult {
  files: FileItem[];
  folders: FileItem[];
  query: string;
  totalResults: number;
}

export interface Folder extends FileItem {
  isFolder: true;
}

export interface File extends FileItem {
  isFolder: false;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  id: string;
}

export interface FileOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface FileDownloadOptions {
  fileId: string;
  asZip?: boolean; // for folders
}

export interface FilePreviewData {
  url: string;
  type: 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'other';
  name: string;
  size: number;
  content?: string; // For text files
}

export interface FileContextMenuOptions {
  preview: boolean;
  download: boolean;
  rename: boolean;
  duplicate: boolean;
  delete: boolean;
  properties: boolean;
  restore?: boolean;
  deleteForever?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

export interface StorageUsage {
  used: number;
  limit: number;
  percentage: number;
}

export interface StorageTypeBreakdown {
  images: number;
  videos: number;
  documents: number;
  audio: number;
  archives: number;
  others: number;
}

export interface StorageStats {
  used: number;
  limit: number;
  percentage: number;
  formattedUsed: string;
  formattedLimit: string;
  usage?: {
    used: number;
    limit: number;
  };
  breakdown?: StorageTypeBreakdown;
  fileCount?: number;
  folderCount?: number;
}

export interface FilePreviewDto {
  url: string;
  type: string;
  name: string;
  size: number;
  content?: string;
} 