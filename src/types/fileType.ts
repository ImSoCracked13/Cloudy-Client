export type FileType = 
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
  
  // Determine by mime type first
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
  path?: string;
  size?: number;
  type?: string;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
  isBin?: boolean;
  location?: string;
  [key: string]: any; // Allow other properties
}

export interface StorageStats {
  used: number;
  total: number;
  percentage: number;
  files: number;

}

export interface FilePreviewDto {
  url: string;
  type: 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'other';
  name: string;
  size: number;
  content?: string;
} 

export interface ApiStorageStats {
  storageUsed: number;
  storageLimit: number;
  fileCount: number;
  [key: string]: any;
}