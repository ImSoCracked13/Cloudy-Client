import { createSignal, createEffect } from 'solid-js';
import { useFileHandler, type FileItem } from '../../handlers/FileHandler';
import FileList from '../../blocks/files/joints/FileList';
import SearchInput from '../../blocks/files/joints/SearchInput';
import StorageBar from '../../blocks/files/joints/StorageBar';
import EmptyBinButton from '../../blocks/files/bin/EmptyBinButton';

export default function BinManager() {
  const fileHandler = useFileHandler();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [files, setFiles] = createSignal<FileItem[]>([]);
  
  // Subscribe to file handler updates
  createEffect(() => {
    const currentFiles = fileHandler.files();
    if (currentFiles) {
      setFiles(currentFiles);
    }
  });
  
  // Handle file restore
  const handleRestore = async (file: FileItem) => {
    try {
      await fileHandler.restore(file.id);
      fileHandler.refreshFiles(true);
    } catch (error) {
      console.error('Error restoring file:', error);
    }
  };
  
  // Handle file delete forever
  const handleDeleteForever = async (file: FileItem) => {
    try {
      await fileHandler.deleteForever(file.id, file.name);
      fileHandler.refreshFiles(true);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };
  
  // Handle empty bin
  const handleEmptyBin = async () => {
    try {
      await fileHandler.emptyBin();
      fileHandler.refreshFiles(true);
    } catch (error) {
      console.error('Error emptying bin:', error);
    }
  };
  
  return (
    <div class="space-y-4">
      <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="w-full md:w-2/3">
          <SearchInput 
            placeholder="Search in bin..." 
            onSearch={(query) => setSearchQuery(query)}
            files={files()}
          />
        </div>
        {/* Empty Bin Button */}
        <div class="flex gap-2 w-full md:w-auto justify-end">
          <EmptyBinButton onEmptyBin={handleEmptyBin} />
        </div>
      </div>

      {/* Storage usage bar */}
      <StorageBar />
      
      {/* Files */}
      <FileList 
        currentPath="/bin"
        isBin={true}
        onFileDelete={handleDeleteForever}
        onFileRestore={handleRestore}
        onFileDeleteForever={handleDeleteForever}
        searchTerm={searchQuery()}
        // These operations are not applicable in the bin context, but pass them to maintain interface compatibility
        onFileDuplicate={() => {}}
        onFileClick={() => {}}
        onFileRename={() => {}}
        onFileDownload={() => {}}
        onFilePreview={() => {}}
        onFileProperties={() => {}}
      />
    </div>
  );
}