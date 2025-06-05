import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { JSX } from 'solid-js';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
}

const [store, setStore] = createStore<ToastStore>({
  toasts: [],
});

// Toast timeout IDs
const timeouts = new Map<string, number>();

export const toastService = {
  show(message: string, type: ToastType = 'info', duration: number = 3000): string {
    const id = Date.now().toString();
    
    setStore(
      produce((state) => {
        state.toasts.push({ id, type, message, duration });
      })
    );

    if (duration > 0) {
      const timeoutId = window.setTimeout(() => {
        this.dismiss(id);
      }, duration);
      
      timeouts.set(id, timeoutId);
    }

    return id;
  },

  dismiss(id: string): void {
    // Clear timeout if it exists
    if (timeouts.has(id)) {
      window.clearTimeout(timeouts.get(id));
      timeouts.delete(id);
    }

    setStore(
      produce((state) => {
        const index = state.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          state.toasts.splice(index, 1);
        }
      })
    );
  },

  dismissAll(): void {
    // Clear all timeouts
    timeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeouts.clear();

    setStore(
      produce((state) => {
        state.toasts = [];
      })
    );
  },

  info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  },

  success(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  },

  warning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration);
  },

  error(message: string, duration?: number): string {
    return this.show(message, 'error', duration);
  },
};

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
}

export default function Toast(props: ToastProps) {
  const getIcon = (): JSX.Element => {
    switch (props.type) {
      case 'success':
        return (
          <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        );
      default:
        return <></>;
    }
  };

  return (
    <div class={`notification notification-${props.type}`}>
      <div class="inline-flex items-center justify-center flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div class="text-sm font-normal">
        {props.message}
      </div>
      <button
        type="button"
        class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-text-muted hover:text-text hover:bg-background-light"
        onClick={props.onClose}
      >
        <span class="sr-only">Close</span>
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
} 