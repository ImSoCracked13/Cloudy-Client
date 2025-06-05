/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places to include
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Formats a file size in bytes to a short human-readable string
 * @param bytes The size in bytes
 * @returns A short formatted string like "1.5M"
 */
export function formatFileSizeShort(bytes: number): string {
  if (bytes === 0) return '0B';
  
  const k = 1024;
  const sizes = ['B', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

/**
 * Parses a human-readable file size string to bytes
 * @param sizeStr The size string (e.g., "1.5 MB" or "1.5MB")
 * @returns The size in bytes
 */
export function parseFileSize(sizeStr: string): number {
  // Remove any spaces and convert to uppercase
  const cleanStr = sizeStr.replace(/\s+/g, '').toUpperCase();
  
  // Match the number and unit parts
  const match = cleanStr.match(/^(\d+(?:\.\d+)?)([KMGTPEZY]?B)?$/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const unit = match[2] || 'B';
  
  const unitIndex = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'].indexOf(unit);
  if (unitIndex < 0) return 0;
  
  return num * Math.pow(1024, unitIndex);
} 