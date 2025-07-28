import { Toaster } from 'solid-toast';

const ToastContainer = () => {
  return (
    <Toaster
      position="bottom-right"
      gutter={8}
      containerClassName="toast-container"
      toastOptions={{
        className: 'toast-message',
        duration: 3000,
        style: {
          'border-radius': '6px',
          padding: '10px 16px',
          'font-size': '14px',
          'font-weight': '500',
          'max-width': '320px',
        },
      }}
    />
  );
};

export default ToastContainer; 