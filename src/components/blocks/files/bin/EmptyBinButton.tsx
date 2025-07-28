import { Component, createSignal } from 'solid-js';
import EmptyBinDialog from './EmptyBinDialog';

interface EmptyBinButtonProps {
  onEmptyBin: () => Promise<void>;
  class?: string;
}

const EmptyBinButton: Component<EmptyBinButtonProps> = (props) => {
  const [showDialog, setShowDialog] = createSignal(false);
  
  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        class="bg-[var(--color-danger)] hover:opacity-90 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Empty Bin
      </button>
      
      <EmptyBinDialog
        isOpen={showDialog()}
        onClose={() => setShowDialog(false)}
        onComplete={props.onEmptyBin}
      />
    </>
  );
};

export default EmptyBinButton;