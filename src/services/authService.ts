import { authGateway } from '../gateway/authGateway';
import type { LoginCredentials, User, GoogleAuthResponse, RegisterResult } from '../types/authType';

/*
* Authentication Service - Handles authentication business logic with internal store
*/
export const authService = {

  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<any> {
    try {
      
      // Store email for verification process
      localStorage.setItem('pending_verification_email', email);
      
      // Register user via API
      const result = await authGateway.register({
        username,
        email,
        password,
        confirmPassword: password,
        authProvider: 'local'
      }) as RegisterResult;
      
      // Set token if available
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      
      return result;
    } catch (error) {
      console.error('Registration error in service:', error);
      throw error;
    }
  },

  /**
   * Login with username or email and password
   */
  async login(identifier: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      
      // Validate inputs
      if (!identifier || !password) {
        throw new Error('Username/email and password are required');
      }
      
      // Clean the input
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password.trim();
      
      if (!cleanIdentifier || !cleanPassword) {
        throw new Error('Username/email and password cannot be empty');
      }
      
      // Create login credentials
      const loginCredentials: LoginCredentials = {
        loginIdentifier: cleanIdentifier,
        password: cleanPassword
      };
      
      // Call the gateway login method
      const result = await authGateway.login(loginCredentials);
      
      if (!result) {
        throw new Error('Login failed: No response from server');
      }
      
      if (!result.token) {
        throw new Error('Login failed: No authentication token received');
      }
      
      // Update store state
      const { token, ...userWithoutToken } = result;
      
      // Return user and token separately
      return {
        user: userWithoutToken,
        token
      };
    } catch (error) {
      console.error('Login error in service:', error);
      throw error;
    }
  },
  
  /**
   * Google login with full response
   */
  async googleAuth(response: GoogleAuthResponse): Promise<{ user: User; token: string } | null> {
    try {
      
      const result = await authGateway.googleAuth(response);
      
      // Check for valid response
      if (!result || !result.user) {
        console.error('Invalid response from googleAuth:', result);
        return null;
      }
      
      // Update store state if successful
      if (result.token) {
        return result;
      }

      return result;
    } catch (error) {
      console.error('Google login error in service:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Try to call the server logout endpoint
      await authGateway.logout().catch(error => {
        console.warn('Logout API call failed:', error);
      });
    } catch (error) {
      console.error('Logout error in service:', error);
    } finally {
      
      // Always clear all auth-related data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      
      // Clear storage stats cache so fresh data is fetched on next login
      localStorage.removeItem('storage_stats');
      localStorage.removeItem('storage_stats_timestamp');
      
      // Clear Google email tracking
      Object.keys(localStorage)
        .filter(key => key.startsWith('google_email_'))
        .forEach(key => localStorage.removeItem(key));
      
      // Clear any other application state that might depend on authentication
      localStorage.removeItem('lastPath');
      localStorage.removeItem('persistentLogin');
      
      // Clear all session storage
      sessionStorage.clear();
      
      // Clear any auth-related cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.toLowerCase().includes('auth') || name.toLowerCase().includes('token')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
      
      // Force a page reload to clear any in-memory state and stop API calls
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
  },
  
  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const result = await authGateway.verifyEmail(token);
      return result;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  },
  
  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const result = await authGateway.sendVerificationEmail(email);
      return result;
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw error;
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<boolean> {
    try {
      const result = await authGateway.deleteAccount(password);
      
      if (result) {
        
        // Perform the same comprehensive cleanup as logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        
        // Clear storage stats cache
        localStorage.removeItem('storage_stats');
        localStorage.removeItem('storage_stats_timestamp');
        
        // Clear Google email tracking
        Object.keys(localStorage)
          .filter(key => key.startsWith('google_email_'))
          .forEach(key => localStorage.removeItem(key));
        
        // Clear any other application state
        localStorage.removeItem('lastPath');
        localStorage.removeItem('persistentLogin');
        
        // Clear all session storage
        sessionStorage.clear();
        
        // Clear any auth-related cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('auth') || name.toLowerCase().includes('token')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  },
  
  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await authGateway.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },
}; 