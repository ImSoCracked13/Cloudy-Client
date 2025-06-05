import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
}

interface NotificationStore {
  notifications: NotificationItem[];
}

// Create a store for notifications
const [store, setStore] = createStore<NotificationStore>({
  notifications: []
});

// Notification timeout IDs
const timeouts = new Map<string, number>();

// Notification service for global use
export const notificationService = {
  show(message: string, type: NotificationType = 'info', duration: number = 5000): string {
    const id = Date.now().toString();
    
    setStore(
      produce((state) => {
        state.notifications.push({ id, type, message, duration });
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
      window.clearTimeout(timeouts.get(id)!);
      timeouts.delete(id);
    }

    setStore(
      produce((state) => {
        const index = state.notifications.findIndex((n) => n.id === id);
        if (index !== -1) {
          state.notifications.splice(index, 1);
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
        state.notifications = [];
      })
    );
  },

  success(message: string, duration?: number): string {
    return this.show(message, 'success', duration);
  },

  error(message: string, duration?: number): string {
    return this.show(message, 'error', duration);
  },

  warning(message: string, duration?: number): string {
    return this.show(message, 'warning', duration);
  },

  info(message: string, duration?: number): string {
    return this.show(message, 'info', duration);
  }
};

export default function Notification() {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fill-rule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clip-rule="evenodd" 
            />
          </svg>
        );
      case 'error':
        return (
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fill-rule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clip-rule="evenodd" 
            />
          </svg>
        );
      case 'warning':
        return (
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fill-rule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clip-rule="evenodd" 
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fill-rule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clip-rule="evenodd" 
            />
          </svg>
        );
    }
  };
  
  const getTypeClasses = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/60 border-green-500/30 text-green-100';
      case 'error':
        return 'bg-red-900/60 border-red-500/30 text-red-100';
      case 'warning':
        return 'bg-yellow-900/60 border-yellow-500/30 text-yellow-100';
      case 'info':
      default:
        return 'bg-blue-900/60 border-blue-500/30 text-blue-100';
    }
  };

  return (
    <div 
      class="fixed bottom-0 right-0 z-50 p-4 max-h-screen overflow-hidden pointer-events-none flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="true"
    >
      <For each={store.notifications}>
        {(notification) => (
          <div 
            class={`
              pointer-events-auto flex items-center w-full max-w-sm
              p-4 mb-1 shadow-lg rounded-md border backdrop-blur-sm
              animate-slide-up
              ${getTypeClasses(notification.type)}
            `}
            role="alert"
          >
            <div class="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div class="ml-3 mr-4 flex-1 font-medium break-words">
              {notification.message}
            </div>
            <button 
              class="inline-flex flex-shrink-0 justify-center items-center h-6 w-6 rounded-md text-white/80 hover:text-white focus:outline-none transition-colors"
              onClick={() => notificationService.dismiss(notification.id)}
              aria-label="Close"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                <path 
                  stroke="currentColor" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  d="M1 1l12 12m0-12L1 13"
                />
              </svg>
            </button>
          </div>
        )}
      </For>
    </div>
  );
} 