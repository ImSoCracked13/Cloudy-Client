import { createSignal, createEffect, For } from 'solid-js';
import { useFilter, type FilterType } from '../../../hooks/files/drive/useFilter';
import Dialog from '../../../widgets/Dialog';
import { type FileItem } from '../../../handlers/FileHandler';

export interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onFilterChange: (selectedTypes: string[]) => void;
}

export default function FilterDialog(props: FilterDialogProps) {
  const { filterFiles, loading: filterLoading, error: filterError } = useFilter();
  
  // Available file types (excluding 'all' since we use checkboxes)
  const fileTypes = [
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archive', label: 'Archives' },
    { value: 'other', label: 'Other Files' }
  ];
  
  // Load saved filter state from localStorage
  const loadSavedFilters = (): Set<string> => {
    try {
      const saved = localStorage.getItem('drive-filter-types');
      if (saved) {
        const types = JSON.parse(saved);
        return new Set(types);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
    return new Set<string>(); // Default: no types selected (show all)
  };
  
  // Save filter state to localStorage
  const saveFilters = (types: Set<string>) => {
    try {
      localStorage.setItem('drive-filter-types', JSON.stringify(Array.from(types)));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  };
  
  // Filter state - track selected types
  const [selectedTypes, setSelectedTypes] = createSignal<Set<string>>(loadSavedFilters());
  
  // Apply filters automatically when selected types change
  const applyFilters = async (types: Set<string>) => {
    const selected = Array.from(types);
    
    try {
      let filteredFiles: FileItem[];
      
      // If no types selected, show all files
      if (selected.length === 0) {
        filteredFiles = props.files;
      } else {
        // Filter files by selected types
        filteredFiles = await filterFiles(selected as FilterType[], props.files);
      }
      
      // Notify parent component with selected types
      props.onFilterChange(selected);
      
      // Save the filter state
      saveFilters(types);
      
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };
  
  // Apply filters when component mounts and when files change
  createEffect(() => {
    if (props.files.length > 0) {
      applyFilters(selectedTypes());
    }
  });
  
  // Toggle a file type
  const toggleType = (type: string) => {
    const current = selectedTypes();
    const newSet = new Set(current);
    
    if (current.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    
    setSelectedTypes(newSet);
    applyFilters(newSet);
  };
  
  return (
    <Dialog
      title="Filter Files"
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <div class="p-4">
        <div class="mb-4">
          <label class="block text-sm font-medium text-text mb-3">
            File Types
          </label>
          <div class="space-y-2">
            <For each={fileTypes}>
              {(fileType) => (
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes().has(fileType.value)}
                    onChange={() => toggleType(fileType.value)}
                    class="w-4 h-4 text-primary bg-background border-background-light rounded focus:ring-primary focus:ring-2"
                    disabled={filterLoading()}
                  />
                  <span class="text-text select-none">{fileType.label}</span>
                </label>
              )}
            </For>
          </div>
          <div class="mt-3 text-sm text-text-muted">
            Toggle file types to filter the file list. Filters are automatically applied and saved.
          </div>
        </div>
        
        {filterError() && (
          <div class="mb-4 text-error text-sm">
            {filterError()}
          </div>
        )}
      </div>
    </Dialog>
  );
}
