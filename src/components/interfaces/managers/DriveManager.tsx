import { createSignal, createEffect } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useFileHandler, type FileItem } from '../../handlers/FileHandler';
import FileList from '../../blocks/files/joints/FileList';
import SearchInput from '../../blocks/files/joints/SearchInput';
import StorageBar from '../../blocks/files/joints/StorageBar';
import UploadButton from '../../blocks/files/drive/UploadButton';
import FilterButton from '../../blocks/files/drive/FilterButton';
import DragDropContainer from '../../blocks/files/drive/DragDropContainer';

export default function DriveManager() {
  const fileHandler = useFileHandler();
  const params = useParams();
  const navigate = useNavigate();
  
  const [currentFolderId, setCurrentFolderId] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [selectedFilterTypes, setSelectedFilterTypes] = createSignal<string[]>([]);
  
  // Load files based on route params
  createEffect(() => {
    const folderId = params.folderId || null;
    setCurrentFolderId(folderId);
    // File fetching is now handled by FileList component
  });

  // Subscribe to file handler updates
  createEffect(() => {
    const currentFiles = fileHandler.files();
    if (currentFiles) {
      setFiles(currentFiles);
    }
  });
  
  // Handle file click
  const handleFileClick = (file: FileItem) => {
    if (file.isBin) {
      navigate(`/drive/${file.id}`);
    } else {
      fileHandler.getPreview(file.id);
    }
  };
  
  // Handle file delete
  const handleDelete = async (file: FileItem) => {
    try {
      await fileHandler.moveToBin(file.id);
      fileHandler.refreshFiles(false);
    } catch (error) {
      console.error('Error moving file to bin:', error);
    }
  };
  
  // Handle file rename
  const handleRename = async (file: FileItem, newName: string) => {
    try {
      const renamedFile = await fileHandler.renameFile(file.id, file.name, newName);
      if (renamedFile) {
        fileHandler.refreshFiles(false);
      }
    } catch (error) {
      console.error('Error renaming file:', error);
    }
  };
  
  // Handle file duplicate
  const handleDuplicate = async (file: FileItem) => {
    try {
      const duplicatedFile = await fileHandler.duplicateFile(file.id);
      if (duplicatedFile) {
        fileHandler.refreshFiles(false);
      }
    } catch (error) {
      console.error('Error duplicating file:', error);
    }
  };
  
  // Handle file download
  const handleDownload = async (file: FileItem) => {
    try {
      await fileHandler.downloadFile(file.id, file.name);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (selectedTypes: string[]) => {
    setSelectedFilterTypes(selectedTypes);
  };

  // Handle files dropped via drag and drop
  const handleFilesDropped = (files: File[]) => {
    setTimeout(() => {
      fileHandler.refreshFiles(false);
    }, 1000);
  };
  
  return (
    <DragDropContainer 
      onFilesSelected={handleFilesDropped}
      parentId={currentFolderId()}
      class="min-h-[500px]"
    >
      <div class="space-y-4">
        {/* Top section with search, filter, and upload */}
        <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="w-full md:w-2/3">
            <SearchInput 
              placeholder="Search files..."
              onSearch={(query) => setSearchQuery(query)}
              files={files()}
            />
          </div>
          <div class="flex gap-2 w-full md:w-auto justify-end">
            <FilterButton
              files={files()}
              onFilterChange={handleFilterChange}
            />
            <UploadButton 
              currentFolderId={currentFolderId()} 
              onUploadComplete={() => fileHandler.refreshFiles(false)}
              onClose={() => {}}
            />
          </div>
        </div>
        
        {/* Storage usage bar */}
        <StorageBar />
        
        {/* Files */}
        <FileList
          currentPath={currentFolderId() ? `/folders/${currentFolderId()}` : '/'}
          onFileClick={handleFileClick}
          onFileDelete={handleDelete}
          onFileRename={handleRename}
          onFileDuplicate={handleDuplicate}
          onFileDownload={handleDownload}
          onFileProperties={async (file) => {
            await fileHandler.loadProperties(file.id);
          }}
          searchTerm={searchQuery()}
          filterTypes={selectedFilterTypes()}
          isBin={false}
        />
      </div>
    </DragDropContainer>
  );
}