import { GoogleAuthResponse } from '../types/authType';

// Google configuration from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Decode a JWT token to extract the payload
 */
function decodeJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT token:', error);
        return null;
    }
}

/**
 * Google Service - Handles Google authentication business logic
 */
export const googleService = {
    /**
   * Get Google Client ID from environment
   */
    getClientId(): string {
        return GOOGLE_CLIENT_ID;
    },

    /**
   * Load Google Identity Services script
   */
    loadGoogleScript(): Promise<void> {
        return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.google) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            if (window.google) {
            resolve();
            } else {
            reject(new Error('Google script loaded but google object not available'));
            }
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Google Identity Services script'));
        };
        
        document.head.appendChild(script);
        });
    },

    /**
   * Initialize Google Identity Services
   */
    initializeGoogle(callback: (response: any) => void): void {
        if (!window.google) {
        throw new Error('Google Identity Services not loaded');
        }

        window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: callback,
        auto_select: false,
        cancel_on_tap_outside: true
        });
    },

    /**
   * Process Google credential response
   */
    processCredentialResponse(response: any): GoogleAuthResponse {
    console.log('Processing Google credential response:', response);
    
    if (!response || !response.credential) {
        throw new Error('Invalid Google credential response');
    }

    // Decode the JWT token to extract user information
    const decodedToken = decodeJWT(response.credential);
    console.log('Decoded Google token:', decodedToken);
    
    if (!decodedToken) {
        throw new Error('Failed to decode Google JWT token');
    }

    // Create a proper GoogleAuthResponse object with user info from the token
    const googleResponse: GoogleAuthResponse = {
        credential: response.credential,
        email: decodedToken.email,
        name: decodedToken.name, 
        sub: decodedToken.sub,
        picture: decodedToken.picture
    };

    return googleResponse;
    },

    /**
   * Render Google Sign-In button
   */
    renderButton(container: HTMLElement, options: any = {}): void {
    if (!window.google) {
        throw new Error('Google Identity Services not initialized');
    }

    const defaultOptions = {
        type: 'standard',
        theme: 'outline', 
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: options.fullWidth ? container.offsetWidth : 240
    };

    window.google.accounts.id.renderButton(container, { ...defaultOptions, ...options });
    }
};