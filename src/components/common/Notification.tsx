import toast from 'solid-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const toastService = {
  show(message: string, type: ToastType = 'info', duration: number = 5000): string {
    // Add event listener for the custom close event
    if (!this._isListening) {
      document.addEventListener('toast-close', ((event: CustomEvent) => {
        if (event.detail?.id) {
          this.dismiss(event.detail.id);
        }
      }) as EventListener);
      this._isListening = true;
    }

    const options = {
      duration,
      position: 'bottom-right' as const,
      style: {
        'border-radius': '6px',
        padding: '10px 16px',
        'padding-right': '40px',
        'font-size': '14px',
        'font-weight': '500',
        'max-width': '320px',
      },
      className: 'toast-message'
    };

    // Add close button to the message
    const messageWithClose = (
      <>
        {message}
        <div 
          class="toast-close" 
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(e.currentTarget.closest('[data-solid-toast]')?.id);
          }}
        />
      </>
    );

    switch (type) {
      case 'success':
        return toast.success(messageWithClose, {
          ...options,
          style: {
            ...options.style,
            background: '#059669',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#059669',
          },
          icon: '✅',
        });
      case 'error':
        return toast.error(messageWithClose, {
          ...options,
          style: {
            ...options.style,
            background: '#DC2626',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#DC2626',
          },
          icon: '🚫',
        });
      case 'warning':
        return toast(messageWithClose, {
          ...options,
          style: {
            ...options.style,
            background: '#D97706',
            color: 'white',
          },
          icon: '⚠️',
        });
      case 'info':
      default:
        return toast(messageWithClose, {
          ...options,
          style: {
            ...options.style,
            background: '#2563EB',
            color: 'white',
          },
          icon: 'ℹ️',
        });
    }
  },

  dismiss(id: string): void {
    toast.dismiss(id);
  },

  dismissAll(): void {
    toast.dismiss();
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

export default toastService; 