import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';
import type { LoginCredentials } from '../../../types/authType';

/**
 * Hook for login functionality
 */
export function useLogin() {
  
  const login = async (usernameOrEmail: string, password: string) => {
    try {
      authStore.setLoginLoading(true);

      // Basic validation
      if (!usernameOrEmail || !password) {
        throw new Error('Username/email and password are required');
      }

      const cleanIdentifier = usernameOrEmail.trim();
      const cleanPassword = password.trim();

      if (!cleanIdentifier || !cleanPassword) {
        throw new Error('Username/email and password cannot be empty');
      }

      // Create login credentials
      const credentials: LoginCredentials = {
        loginIdentifier: cleanIdentifier,
        password: cleanPassword
      };

      const response = await authService.login(credentials.loginIdentifier, credentials.password);

      if (!response) {
        throw new Error('Login failed: No response received');
      }

      // Extract user and token from response
      const { user, token } = response;

      if (!user) {
        throw new Error('Login failed: No user data received');
      }

      if (!token) {
        throw new Error('Login failed: No authentication token received');
      }

      // Store the token in localStorage
      localStorage.setItem('authToken', token);
      sessionStorage.removeItem('authToken');

      // Update store with user data
      authStore.setUser(user);
      authStore.setLoginLoading(false);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      authStore.setLoginError(errorMessage);
      return null;
    }
  };
  
  return {
    login,
    loading: () => authStore.state.loginLoading,
    error: () => authStore.state.loginError
  };
}
