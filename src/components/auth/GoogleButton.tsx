import { createEffect, onCleanup, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../common/Notification';

interface GoogleButtonProps {
  fullWidth?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Helper function to decode JWT payload
function decodeJwtPayload(token: string): any {
  try {
    // JWT format: header.payload.signature
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return {};
  }
}

export default function GoogleButton(props: GoogleButtonProps) {
  const navigate = useNavigate();
  const { state, handleGoogleLogin } = useAuth();
  let buttonRef: HTMLDivElement | undefined;
  let googleButtonContainer: HTMLDivElement | undefined;

  onMount(() => {
    // Check if Google API is loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      initializeGoogleButton();
    }
  });

  const initializeGoogleButton = () => {
    if (!window.google?.accounts?.id || !buttonRef) return;

    // Get client ID from window.env or import.meta.env
    const clientId = (window as any).env?.VITE_GOOGLE_CLIENT_ID || 
                     import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Missing Google Client ID environment variable');
      notificationService.error('Google authentication is not properly configured');
      
      // Show fallback button
      if (googleButtonContainer) {
        googleButtonContainer.style.display = 'block';
      }
      return;
    }
    
    // Log useful information for debugging
    console.log('Current origin:', window.location.origin);
    console.log('Initializing Google button with client ID:', clientId);
    
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        // Add allowed origins to handle the domain issue
        allowed_parent_origin: window.location.origin
      });

      window.google.accounts.id.renderButton(buttonRef, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: props.fullWidth ? 400 : 240,
      });
      
      console.log('Google button initialized successfully');
    } catch (error) {
      console.error('Error initializing Google button:', error);
      
      // Show a more detailed error message
      notificationService.error('Google Sign-In is not available. The current origin may not be authorized for this client ID.');
      
      // If Google button fails to initialize, show a custom button
      if (googleButtonContainer) {
        googleButtonContainer.style.display = 'block';
      }
    }
  };

  // Handle Google auth token
  const handleCredentialResponse = async (response: any) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('Google login response received, processing...');
      console.log('Credential length:', response.credential.length);
      
      // Decode the JWT token to extract user info
      const decodedToken = decodeJwtPayload(response.credential);
      
      if (!decodedToken || !decodedToken.email) {
        throw new Error('Invalid token or missing email in Google response');
      }
      
      // Create a response object with the necessary data
      const googleResponse = {
        token: response.credential,
        credential: response.credential,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        sub: decodedToken.sub
      };
      
      // Log for debugging
      console.log('Decoded token:', { 
        email: decodedToken.email,
        name: decodedToken.name,
        sub: decodedToken.sub
      });
      
      console.log('Calling handleGoogleLogin with response object...');
      const user = await handleGoogleLogin(googleResponse);
      
      console.log('handleGoogleLogin result:', user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        isAuthenticated: true
      } : 'null');
      
      if (user) {
        notificationService.success('Successfully logged in with Google');
        console.log('Navigating to /drive');
        navigate('/drive');
      } else {
        console.error('Google login failed: No user returned');
        notificationService.error('Failed to login with Google');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      notificationService.error(error instanceof Error ? error.message : 'Google authentication failed');
    }
  };

  createEffect(() => {
    initializeGoogleButton();
  });

  onCleanup(() => {
    // Clean up Google API if needed
  });

  return (
    <div class="relative">
      {/* Container for Google's rendered button */}
      <div ref={buttonRef} class="google-signin-button"></div>
      
      {/* Fallback custom button */}
      <div 
        ref={googleButtonContainer} 
        style="display: none;"
      >
        <button
          type="button"
          class={`flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 transition-colors duration-200 ${props.fullWidth ? 'w-full' : ''}`}
          onClick={() => {
            notificationService.error('Google authentication is not available. Please try again later or use email login.');
          }}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
} 