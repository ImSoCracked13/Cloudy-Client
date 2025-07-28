import { Component, createSignal } from 'solid-js';
import Button from '../../../widgets/Button';
import FilterDialog from './FilterDialog';
import { type FileItem } from '../../../handlers/FileHandler';

interface FilterButtonProps {
  files: FileItem[];
  onFilterChange: (selectedTypes: string[]) => void;
  class?: string;
}

const FilterButton: Component<FilterButtonProps> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  
  const handleFilterChange = (selectedTypes: string[]) => {
    props.onFilterChange(selectedTypes);
  };
  
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        <span>Filter</span>
        </div>
      </Button>
      
      <FilterDialog
        isOpen={isDialogOpen()}
        onClose={() => setIsDialogOpen(false)}
        onFilterChange={handleFilterChange}
        files={props.files}
      />
    </>
  );
};

export default FilterButton;
