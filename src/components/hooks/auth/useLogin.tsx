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

      // Store the token based on persistence preference
      const isPersistent = localStorage.getItem('persistentLogin') === 'true';
      if (isPersistent) {
        localStorage.setItem('authToken', token);
        sessionStorage.removeItem('authToken');
      } else {
        sessionStorage.setItem('authToken', token);
        localStorage.removeItem('authToken');
      }

      // Update store with user data
      authStore.setUser(user);
      authStore.setLoginLoading(false);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid username/email or password.';
        } else if (error.message.includes('404')) {
          errorMessage = 'User not found.';
        } else if (error.message.includes('required') || error.message.includes('empty')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      authStore.setLoginError(errorMessage);
      return null;
    }
  };
  
  const setPersistentLogin = (enabled: boolean) => {
    localStorage.setItem('persistentLogin', enabled.toString());
    
    // Move token between storages based on persistence setting
    const localToken = localStorage.getItem('authToken');
    const sessionToken = sessionStorage.getItem('authToken');
    const token = localToken || sessionToken;

    if (token) {
      if (enabled) {
        localStorage.setItem('authToken', token);
        sessionStorage.removeItem('authToken');
      } else {
        sessionStorage.setItem('authToken', token);
        localStorage.removeItem('authToken');
      }
    }
  };
  
  const isPersistentLoginEnabled = () => {
    return localStorage.getItem('persistentLogin') === 'true';
  };
  
  return {
    login,
    loading: () => authStore.state.loginLoading,
    error: () => authStore.state.loginError,
    setPersistentLogin,
    isPersistentLoginEnabled
  };
}
