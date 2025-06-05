import { createSignal, createEffect, onMount, Show, For } from 'solid-js';
import { fileGateway } from '../components/gateway/fileGateway';
import { StorageStats, StorageTypeBreakdown } from '../components/types/file';
import Card from '../components/widgets/Card';
import Spinner from '../components/widgets/Spinner';
import StorageUsageBar from '../components/widgets/StorageUsageBar';

export default function Storage() {
  const [stats, setStats] = createSignal<StorageStats | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  
  onMount(() => {
    loadStorageStats();
  });
  
  const loadStorageStats = async () => {
    setIsLoading(true);
    try {
      const storageStats = await fileGateway.getStorageStats();
      if (storageStats) {
        setStats(storageStats);
      }
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fileCategoriesData = () => {
    if (!stats() || !stats()!.breakdown) return [];
    
    const breakdown = stats()!.breakdown;
    if (!breakdown) return [];
    
    return [
      { 
        type: 'images', 
        size: breakdown.images, 
        label: 'Images', 
        icon: 'image',
        color: 'text-blue-500'
      },
      { 
        type: 'videos', 
        size: breakdown.videos, 
        label: 'Videos', 
        icon: 'video',
        color: 'text-red-500'
      },
      { 
        type: 'documents', 
        size: breakdown.documents, 
        label: 'Documents', 
        icon: 'document',
        color: 'text-yellow-500'
      },
      { 
        type: 'audio', 
        size: breakdown.audio, 
        label: 'Audio', 
        icon: 'audio',
        color: 'text-green-500'
      },
      { 
        type: 'archives', 
        size: breakdown.archives, 
        label: 'Archives', 
        icon: 'archive',
        color: 'text-purple-500'
      },
      { 
        type: 'others', 
        size: breakdown.others, 
        label: 'Others', 
        icon: 'file',
        color: 'text-gray-500'
      }
    ];
  };
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getIconForFileType = (type: string) => {
    switch (type) {
      case 'image':
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'archive':
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      default:
        return (
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  const getReadableFileType = (type: string): string => {
    const types: Record<string, string> = {
      images: 'Images',
      videos: 'Videos',
      documents: 'Documents',
      audio: 'Audio',
      archives: 'Archives',
      others: 'Others'
    };
    
    return types[type] || 'Unknown';
  };
  
  return (
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Storage</h1>
      
      <Show when={!isLoading()} fallback={<div class="flex justify-center py-10"><Spinner size="lg" /></div>}>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card class="lg:col-span-2">
            <div class="p-6">
              <h2 class="text-lg font-semibold mb-4">Storage Usage</h2>
              
              <Show when={stats()}>
                <StorageUsageBar 
                  used={stats()!.used} 
                  limit={stats()!.limit} 
                  class="mb-6"
                  showDetails={true}
                />
              </Show>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div class="bg-background-light/10 p-4 rounded-md">
                  <h3 class="text-sm font-medium text-text-muted mb-2">Total Files</h3>
                  <p class="text-2xl font-bold">{stats()?.fileCount || 0}</p>
                </div>
                
                <div class="bg-background-light/10 p-4 rounded-md">
                  <h3 class="text-sm font-medium text-text-muted mb-2">Total Folders</h3>
                  <p class="text-2xl font-bold">{stats()?.folderCount || 0}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <div class="p-6">
              <h2 class="text-lg font-semibold mb-4">Account Info</h2>
              
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-medium text-text-muted mb-1">Storage Plan</h3>
                  <p class="text-text">Free Plan</p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-text-muted mb-1">Storage Limit</h3>
                  <p class="text-text">{stats() ? formatBytes(stats()!.limit) : '0 GB'}</p>
                </div>
                
                <div>
                  <h3 class="text-sm font-medium text-text-muted mb-1">Upgrade Options</h3>
                  <button class="mt-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm">
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <Show when={stats() && stats()!.breakdown}>
          <Card class="mt-6">
            <div class="p-6">
              <h2 class="text-lg font-semibold mb-4">Storage Breakdown</h2>
              
              <div class="space-y-6">
                <div class="h-2 w-full bg-background-light/30 rounded-full overflow-hidden">
                  <For each={fileCategoriesData()}>
                    {(category) => (
                      <div 
                        class={`h-full ${category.color} relative`}
                        style={{ width: `${(category.size / stats()!.used) * 100}%` }}
                      ></div>
                    )}
                  </For>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <For each={fileCategoriesData()}>
                    {(category) => (
                      <div class="flex items-center space-x-3">
                        <div class={`${category.color} p-2 rounded-md`}>
                          {getIconForFileType(category.icon)}
                        </div>
                        <div>
                          <p class="font-medium">{category.label}</p>
                          <div class="flex items-center text-sm text-text-muted">
                            <span>{formatBytes(category.size)}</span>
                            <span class="mx-1">•</span>
                            <span>
                              {((category.size / stats()!.used) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Card>
        </Show>
      </Show>
    </div>
  );
} 