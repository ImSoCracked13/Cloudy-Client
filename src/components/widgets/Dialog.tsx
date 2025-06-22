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
    if (!props.preventClose && dialogRef && !dialogRef.contains(e.target as Node)) {
      props.onClose();
    }
  };

  onMount(() => {
    if (props.onOpen) {
      props.onOpen();
    }
  });

  createEffect(() => {
    if (props.isOpen) {
      // Add event listeners with a small delay to prevent immediate triggering
      setTimeout(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      // Focus the dialog
      if (dialogRef) {
        dialogRef.focus();
      }
    }
  });

    onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <Show when={props.isOpen}>
      <div 
        class="dialog-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        id={props.id}
      >
        <div 
          ref={dialogRef} 
          class={`dialog-content ${getDialogSizeClass()}`}
          role="document"
          tabIndex={-1}
        >
          <div class="flex justify-between items-center mb-4 pb-3 border-b border-background-light/20">
            <h3 
              id="dialog-title"
              class="text-lg font-semibold text-text"
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
                class="text-text-muted hover:text-text focus:outline-none rounded-full hover:bg-background-light/30 p-1.5 transition-colors"
                aria-label="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div 
            class="mt-3 overflow-y-auto max-h-[70vh] custom-scrollbar pr-1"
            aria-describedby="dialog-description"
          >
            <div id="dialog-description">
              {props.children}
            </div>
          </div>
          
          {props.actions && (
            <div class="mt-6 flex justify-end gap-3 pt-3 border-t border-background-light/20">
              {props.actions}
            </div>
          )}
        </div>
      </div>
    </Show>
  );
} 