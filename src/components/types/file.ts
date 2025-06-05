export type FileType = 'folder' | 'image' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'video' | 'audio' | 'archive' | 'other';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: FileType;
  mimeType: string | null;
  size: number;
  isFolder: boolean;
  isPublic: boolean;
  location: 'Drive' | 'Bin';
  isInBin?: boolean;
  thumbnailUrl?: string;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
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

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
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