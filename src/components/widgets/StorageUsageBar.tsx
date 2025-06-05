import { createMemo } from 'solid-js';
import { formatFileSize } from '../utilities/formatFileSize';

interface StorageUsageBarProps {
  used?: number;
  limit?: number;
  usedBytes?: number;
  totalBytes?: number;
  class?: string;
  showDetails?: boolean;
}

export default function StorageUsageBar(props: StorageUsageBarProps) {
  const usedStorage = () => props.used || props.usedBytes || 0;
  const limitStorage = () => props.limit || props.totalBytes || 1;
  
  const usedPercentage = createMemo(() => {
    const percentage = (usedStorage() / limitStorage()) * 100;
    return Math.min(percentage, 100);
  });
  
  const getColorClass = createMemo(() => {
    const percentage = usedPercentage();
    if (percentage >= 90) return 'from-red-500 to-red-600';
    if (percentage >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  });
  
  return (
    <div class={`${props.class || ''}`}>
      <div class="flex justify-between items-center mb-2">
        <div class="text-sm font-semibold text-text">Storage Usage</div>
        <div class="text-xs font-medium text-text-muted">
          {formatFileSize(usedStorage())} / {formatFileSize(limitStorage())}
        </div>
      </div>
      
      <div class="storage-bar">
        <div 
          class={`storage-bar-fill bg-gradient-to-r ${getColorClass()}`}
          style={{ width: `${usedPercentage()}%` }}
          role="progressbar"
          aria-valuenow={usedPercentage()}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Storage usage: ${usedPercentage().toFixed(1)}%`}
        />
      </div>
      
      {props.showDetails !== false && (
        <div class="flex justify-between items-center mt-2">
          <div class="text-xs font-medium text-text-muted">
            {usedPercentage().toFixed(1)}% used
          </div>
          <div class="text-xs font-medium text-text-muted">
            {formatFileSize(limitStorage() - usedStorage())} free
          </div>
        </div>
      )}
    </div>
  );
} 