import { createEffect } from 'solid-js';
import { userStore, userActions } from '../stores/userStore';
import { authGateway } from '../gateway/authGateway';
import type { User as ApiUser } from '../types/userType';

/**
 * Hook to use the user store
 * Provides access to user state and actions
 */
export function useUser() {
  // Helper function to check if the user is authenticated
  const isAuthenticated = () => userStore.state.isAuthenticated && !!userStore.state.user;
  
  // Helper function to check if auth is loading
  const isLoading = () => userStore.state.isLoading;
  
  // Helper function to get error
  const getError = () => userStore.state.error;
  
  // Helper function to get user data
  const getUserData = () => userStore.state.user;
  
  // Helper function to initialize user from token
  const initializeFromToken = async () => {
    try {
      userActions.setLoading(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        userActions.logout();
        return false;
      }
      
      // Use the gateway to get current user
      const apiUser = await authGateway.getCurrentUser();
      
      if (apiUser) {
        // Adapt API user to store user
        const storeUser = {
          id: apiUser.id,
          email: apiUser.email,
          displayName: apiUser.username || apiUser.email.split('@')[0],
          isVerified: apiUser.isVerified,
          createdAt: apiUser.createdAt,
          photoURL: apiUser.avatar,
          lastLogin: apiUser.updatedAt,
          preferences: {
            theme: 'system' as 'light' | 'dark' | 'system'
          }
        };
        userActions.setUser(storeUser);
        return true;
      } else {
        userActions.logout();
        return false;
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      userActions.setError(error instanceof Error ? error.message : 'Failed to initialize user');
      return false;
    } finally {
      userActions.setLoading(false);
    }
  };
  
  // Helper function to log out
  const logout = async () => {
    try {
      userActions.setLoading(true);
      
      // Use the gateway to logout
      await authGateway.logout();
      
      // Clear user data from store
      userActions.logout();
      
      // Remove token
      localStorage.removeItem('authToken');
      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      userActions.setError(error instanceof Error ? error.message : 'Failed to log out');
      return false;
    } finally {
      userActions.setLoading(false);
    }
  };
  
  return {
    user: getUserData,
    isAuthenticated,
    isLoading,
    error: getError,
    initializeFromToken,
    logout,
    setUser: userActions.setUser,
    setError: userActions.setError,
    updatePreferences: userActions.updatePreferences
  };
}

export default useUser; 