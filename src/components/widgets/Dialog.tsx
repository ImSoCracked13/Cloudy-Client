import { JSX, Show, createEffect, onCleanup } from 'solid-js';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  actions?: JSX.Element;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  preventClose?: boolean;
}

export default function Dialog(props: DialogProps) {
  let dialogRef: HTMLDivElement | undefined;
  
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !props.preventClose) {
      props.onClose();
    }
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (dialogRef && !dialogRef.contains(e.target as Node) && !props.preventClose) {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden';
    }

    onCleanup(() => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = '';
    });
  });

  const getDialogSizeClass = () => {
    switch (props.size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-lg';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      case '2xl': return 'max-w-6xl';
      default: return 'max-w-lg';
    }
  };

  return (
    <Show when={props.isOpen}>
      <div 
        class="dialog-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
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
                onClick={props.onClose}
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