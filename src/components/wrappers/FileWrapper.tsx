import { Component, JSX, Show, createSignal } from 'solid-js';
import Card from '../widgets/Card';
import DriveManager from '../interfaces/managers/DriveManager';
import BinManager from '../interfaces/managers/BinManager';
import StorageManager from '../interfaces/managers/StorageManager';

type FileWrapperProps = {
  type: 'drive' | 'bin' | 'storage';
  class?: string;
  children?: JSX.Element;
};

const FileWrapper: Component<FileWrapperProps> = (props) => {
  const [error, setError] = createSignal<string | null>(null);
  
  
  const renderContent = () => {
    try {
      switch (props.type) {
        case 'drive':
          return <DriveManager />;
        case 'bin':
          return <BinManager />;
        case 'storage':
          return <StorageManager />;
        default:
          return null;
      }
    } catch (err) {
      setError(`Failed to load ${props.type} content. Please try again.`);
      return null;
    }
  };

  return (
    <Card class={props.class}>
      <Show
        when={!error()}
        fallback={
          <div class="flex flex-col items-center justify-center h-64 gap-4">
            <div class="text-error text-lg">{error()}</div>
            <button
              class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        }
      >
        {renderContent() || props.children}
      </Show>
    </Card>
  );
};

export default FileWrapper;
