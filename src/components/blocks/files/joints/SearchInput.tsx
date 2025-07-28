import { Component, createSignal, createEffect } from 'solid-js';
import { useSearch } from '../../../hooks/files/joints/useSearch';
import Input from '../../../widgets/Input';
import { type FileItem } from '../../../handlers/FileHandler';

interface SearchInputProps {
  placeholder?: string;
  files?: FileItem[];
  onSearch: (query: string) => void;
}

const SearchInput: Component<SearchInputProps> = (props) => {
  const { clearSearch, loading, error } = useSearch();
  const [searchQuery, setSearchQuery] = createSignal('');
  
  // Handle search input change
  const handleChange = (value: string) => {
    setSearchQuery(value);
    props.onSearch(value);
  };

  // Clear search when files prop changes
  createEffect(() => {
    if (props.files && props.files.length === 0) {
      clearSearch();
      setSearchQuery('');
    }
  });
  
  return (
    <div class="relative w-full">
    <Input
      type="text"
        placeholder={props.placeholder || 'Search files...'}
      value={searchQuery()}
      onInput={(e) => handleChange(e.currentTarget.value)}
      class="w-full"
        disabled={loading()}
    />
      {error() && (
        <div class="absolute top-full mt-1 text-sm text-error">
          {error()}
        </div>
      )}
    </div>
  );
};

export default SearchInput;