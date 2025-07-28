import { JSX, Show, createEffect, onCleanup, onMount } from 'solid-js';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  actions?: JSX.Element;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  preventClose?: boolean;
  onOpen?: () => void;
  id?: string;
}

export default function Dialog(props: DialogProps) {
  let dialogRef: HTMLDivElement | undefined;
  
  const getDialogSizeClass = () => {
    switch (props.size) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      default:
        return 'max-w-md';
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !props.preventClose) {
      e.preventDefault();
      props.onClose();
    }
  };

  // Handle click outside
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (props.preventClose) return;
    
    // Only close if clicking the overlay directly
    if (target.classList.contains('dialog-overlay')) {
      props.onClose();
    }
  };

  onMount(() => {
    if (props.onOpen) {
      props.onOpen();
    }
    
    // Prevent body scrolling when dialog is open
    document.body.style.overflow = 'hidden';
  });

  createEffect(() => {
    if (props.isOpen) {
      // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

      // Focus the dialog
      if (dialogRef) {
        dialogRef.focus();
      }
    }
  });

    onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleClickOutside);
    
    // Restore body scrolling
    document.body.style.overflow = '';
  });

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-[100] overflow-y-auto">
        {/* Overlay */}
      <div 
          class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity dialog-overlay"
        />
        
        <div class="flex min-h-screen items-center justify-center p-4 relative z-[101]">
          {/* Dialog */}
          <div 
            ref={dialogRef}
            class="relative bg-[#1E1E1E] rounded-lg shadow-2xl w-full border border-gray-700"
            classList={{
              [getDialogSizeClass()]: true
            }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
            style="transform: translateZ(0); will-change: transform;"
          >
            {/* Header */}
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 
              id="dialog-title"
                class="text-lg font-medium text-white"
            >
              {props.title}
            </h3>
            {!props.preventClose && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onClose();
                }}
                  class="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700/50"
                aria-label="Close dialog"
              >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
            {/* Content */}
            <div class="p-4 text-gray-200">
              {props.children}
          </div>
          
            {/* Actions */}
          {props.actions && (
              <div class="p-4 border-t border-gray-700 flex justify-end space-x-3">
              {props.actions}
            </div>
          )}
          </div>
        </div>
      </div>
    </Show>
  );
} 