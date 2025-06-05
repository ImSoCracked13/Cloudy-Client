import { authService } from '../services/authService';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  User,
  VerificationData, 
  PasswordChangeData,
  GoogleAuthResponse
} from '../types/user';

// Get API URL from window.env or import.meta.env
const API_URL = (window as any).env?.VITE_API_URL || 
                import.meta.env.VITE_API_URL || 
                'http://localhost:3000';

console.log('Auth Gateway initialized with API URL:', API_URL);

/**
 * Authentication Gateway - Handles all API calls related to user authentication
 */
export const authGateway = {
  /**
   * Login with username/email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    console.log('Login request:', { usernameOrEmail: credentials.usernameOrEmail });
    
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usernameOrEmail: credentials.usernameOrEmail,
          password: credentials.password
        }),
        credentials: 'include'
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data structure:', {
        success: data.success,
        message: data.message,
        hasData: !!data.data,
        hasUser: data.data && !!data.data.user,
        hasToken: data.data && !!data.data.token
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success || !data.data || !data.data.user) {
        throw new Error('Invalid response format from server');
      }

      // Store token if it exists in the response
      if (data.data.token) {
        console.log('Storing auth token from login, length:', data.data.token.length);
        localStorage.setItem('authToken', data.data.token);
      } else {
        console.error('No token received in login response');
      }

      return data.data.user;
    } catch (error) {
      console.error('Login error in gateway:', error);
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<{ user: User | null; message: string }> {
    console.log('Register request:', { ...credentials, password: '[REDACTED]' });
    
    try {
      // Prepare request body
      const requestBody = {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        confirmPassword: credentials.confirmPassword,
        authProvider: credentials.authProvider || 'local'
      };
      
      console.log('Sending register request to server:', JSON.stringify({
        ...requestBody,
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]'
      }));
      
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      console.log('Register response status:', response.status);
      
      // Get response text first for debugging
      const responseText = await response.text();
      console.log('Register raw response:', responseText);
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse register response as JSON:', parseError);
        throw new Error('Invalid response format from server: not valid JSON');
      }
      
      console.log('Register response data (full):', JSON.stringify(data));
      console.log('Register response structure:', {
        success: data.success,
        message: data.message,
        hasData: !!data.data,
        dataType: data.data ? typeof data.data : 'undefined',
        hasUser: data.data && !!data.data.user,
        hasToken: data.data && !!data.data.token
      });

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token if it exists in the response
      if (data.success && data.data && data.data.token) {
        console.log('Storing auth token from register, length:', data.data.token.length);
        localStorage.setItem('authToken', data.data.token);
      } else {
        console.warn('No token received in register response');
      }

      return {
        user: data.data && data.data.user ? data.data.user : null,
        message: data.message || 'Registration successful'
      };
    } catch (error) {
      console.error('Register error in gateway:', error);
      throw error;
    }
  },

  /**
   * Google authentication
   */
  async googleAuth(response: GoogleAuthResponse): Promise<{ user: User; token: string } | null> {
    console.log('Google auth request:', { 
      sub: response.sub, 
      email: response.email, 
      name: response.name,
      hasToken: !!response.token,
      hasCredential: !!response.credential
    });
    
    try {
      // Prepare request body
      const requestBody = { 
        googleId: response.sub || response.email || 'google-' + Date.now(),
        email: response.email || 'user@example.com',
        name: response.name || 'Google User'
      };
      
      console.log('Sending Google auth request to server:', JSON.stringify(requestBody));
      
      const apiResponse = await fetch(`${API_URL}/api/users/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      console.log('Google auth response status:', apiResponse.status);
      
      // Get response text first for debugging
      const responseText = await apiResponse.text();
      console.log('Google auth raw response:', responseText);
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Google auth response as JSON:', parseError);
        throw new Error('Invalid response format from server: not valid JSON');
      }
      
      console.log('Google auth response data (full):', JSON.stringify(data));
      console.log('Google auth response structure:', {
        success: data.success,
        message: data.message,
        hasData: !!data.data,
        dataType: data.data ? typeof data.data : 'undefined',
        hasUser: data.data && !!data.data.user,
        hasToken: data.data && !!data.data.token
      });

      if (!apiResponse.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server: missing success or data');
      }

      if (!data.data.user || !data.data.token) {
        throw new Error('Invalid response format from server: missing user or token in data');
      }

      // Store token in localStorage
      console.log('Storing auth token, length:', data.data.token.length);
      localStorage.setItem('authToken', data.data.token);
      
      return {
        user: data.data.user,
        token: data.data.token
      };
    } catch (error) {
      console.error('Google auth error in gateway:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    console.log('Verify email request:', { token });
    
    try {
      const response = await fetch(`${API_URL}/api/users/verify/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Verify email response status:', response.status);
      const data = await response.json();
      console.log('Verify email response data:', data);

      return response.ok && data.success;
    } catch (error) {
      console.error('Verify email error in gateway:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    console.log('Request password reset:', { email });
    
    try {
      const response = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      console.log('Password reset request response status:', response.status);
      const data = await response.json();
      console.log('Password reset request response data:', data);

      return response.ok && data.success;
    } catch (error) {
      console.error('Password reset request error in gateway:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    console.log('Reset password request:', { token, passwordLength: newPassword?.length });
    
    try {
      const response = await fetch(`${API_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });

      console.log('Reset password response status:', response.status);
      const data = await response.json();
      console.log('Reset password response data:', data);

      return response.ok && data.success;
    } catch (error) {
      console.error('Reset password error in gateway:', error);
      throw error;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log('Get current user response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
        }
        return null;
      }

      const data = await response.json();
      console.log('Get current user response data:', data);
      
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error('Get current user error in gateway:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    console.log('Update profile request:', userData);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      console.log('Update profile response status:', response.status);
      const data = await response.json();
      console.log('Update profile response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }

      return data.data;
    } catch (error) {
      console.error('Update profile error in gateway:', error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    console.log('Change password request');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      console.log('Change password response status:', response.status);
      const data = await response.json();
      console.log('Change password response data:', data);

      return response.ok && data.success;
    } catch (error) {
      console.error('Change password error in gateway:', error);
      throw error;
    }
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    console.log('Resend verification email request:', { email });
    
    try {
      const response = await fetch(`${API_URL}/api/users/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      console.log('Resend verification email response status:', response.status);
      const data = await response.json();
      console.log('Resend verification email response data:', data);

      return response.ok && data.success;
    } catch (error) {
      console.error('Resend verification email error in gateway:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<boolean> {
    console.log('Logout request');
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        const response = await fetch(`${API_URL}/api/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Logout response status:', response.status);
        
        localStorage.removeItem('authToken');
        return response.ok;
      } else {
        console.log('No token found, considering logout successful');
        return true;
      }
    } catch (error) {
      console.error('Logout error in gateway:', error);
      localStorage.removeItem('authToken');
      return true; // Still consider logout successful if API call fails
    }
  },

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<boolean> {
    console.log('Delete account request');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      console.log('Delete account response status:', response.status);
      const data = await response.json();
      console.log('Delete account response data:', data);
      
      if (response.ok && data.success) {
        localStorage.removeItem('authToken');
        return true;
      }
      
      throw new Error(data.message || 'Failed to delete account');
    } catch (error) {
      console.error('Delete account error in gateway:', error);
      throw error;
    }
  }
}; 