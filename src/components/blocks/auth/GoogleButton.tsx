import { createEffect, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useGoogleAuth } from '../../hooks/auth/useGoogleAuth';
import toastService from '../../common/Notification';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleButton(props: GoogleButtonProps) {
  const navigate = useNavigate();
  const { googleAuth, error } = useGoogleAuth();
  let buttonRef: HTMLDivElement | undefined;

  // Handle successful authentication
  const handleSuccess = (user: any) => {
    // Always navigate to /drive
    navigate('/drive');
  };

  // Parse JWT token to get email
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      toastService.error('Failed to parse Google authentication response. Please try again.');
      return null;
    }
  };

  // Handle Google authentication errors and if the account is already registered as local auth. This may may general, but it's simply one error like so.
  createEffect(() => {
    if (error()) {
      toastService.error('This email is already registered with local authentication. Please use local login instead.');
      return;
    }
  });

  onMount(() => {
    // Wait for Google to be loaded and render the button
    const renderGoogleButton = () => {
      if (window.google && buttonRef) {
        window.google.accounts.id.initialize({
          client_id: '584040192605-go1fbggkk7is3j7ntumq61d0d5gi8gj5.apps.googleusercontent.com',
          callback: async (response: any) => {
            try {
              // Parse the JWT token to get the email
              const payload = parseJwt(response.credential);
              if (!payload || !payload.email) {
                toastService.error('Failed to get email from Google response');
                return;
              }

              const user = await googleAuth(response);
              if (user) {
                handleSuccess(user);
                toastService.success('Google authentication successful');
              }
            } catch (err) {
              toastService.error('Google authentication failed: ' + err)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Calculate width based on container
        const width = props.fullWidth ? buttonRef.offsetWidth : 240;

        window.google.accounts.id.renderButton(buttonRef, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: width
        });
      } else {
        // If Google is not loaded yet, try again in 100ms
        setTimeout(renderGoogleButton, 100);
      }
    };

    renderGoogleButton();
  });

  return (
    <div 
      ref={buttonRef} 
      class={`google-signin-button ${props.fullWidth ? 'w-full' : ''}`}
      style={{ 
        "min-height": "40px", 
        "display": "flex",
        "justify-content": "center",
        "width": props.fullWidth ? "100%" : "240px"
      }}
    />
  );
}