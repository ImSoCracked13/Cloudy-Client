import { onMount } from 'solid-js';
import { authService } from '../../../services/authService';
import { googleService } from '../../../services/googleService';
import { authStore } from '../../store/AuthStore';
import { GoogleAuthResponse, User } from '../../../types/authType';

/**
 * Hook for Google authentication
 */
export function useGoogleAuth(onSuccess?: (user: User) => void) {

  // Load Google script and initialize on mount
  onMount(async () => {
    try {
      // Load Google Identity Services script
      await googleService.loadGoogleScript();
      
      // Initialize Google with credential handler
      googleService.initializeGoogle(handleCredentialResponse);
    } catch (err) {
      authStore.setGoogleAuthError(err instanceof Error ? err.message : 'Failed to initialize Google authentication');
    }
  });

  // Handle the credential response from Google
  const handleCredentialResponse = async (response: any) => {
    try {
      // Process the credential response using googleService
      const googleResponse: GoogleAuthResponse = googleService.processCredentialResponse(response);
      
      // Authenticate with backend
      await googleAuth(googleResponse);
    } catch (err) {
      authStore.setGoogleAuthError(err instanceof Error ? err.message : 'Failed to process Google authentication');
    }
  };

  const googleAuth = async (response: GoogleAuthResponse) => {
    authStore.setGoogleAuthLoading(true);

    try {
      // Use authService to authenticate with backend
      const result = await authService.googleAuth(response);
      
      if (result && result.user) {
        // Update store with user data
        authStore.setUser(result.user);
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result.user);
        }
        
        authStore.setGoogleAuthLoading(false);
        return result.user;
      } else {
        throw new Error('Google authentication failed: No user returned');
      }
    } catch (error) {
      authStore.setGoogleAuthError(error instanceof Error ? error.message : 'Google authentication failed');
      return null;
    }
  };

  return {
    googleAuth,
    loading: () => authStore.state.googleAuthLoading,
    error: () => authStore.state.googleAuthError
  };
}
