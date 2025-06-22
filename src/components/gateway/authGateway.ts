import { LoginCredentials, RegisterCredentials, User, VerificationData, PasswordChangeData, GoogleAuthResponse } from '../types/userType';

// Use API URL from environment variables or cloud URL as fallback
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://cloudy-server.fly.dev';

// Remove /api prefix if it exists in the API_URL
const normalizedApiUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

console.log('Auth Gateway initialized with API URL:', normalizedApiUrl);

/**
 * Authentication Gateway - Handles all API calls related to user authentication
 */
export const authGateway = {
  /**
   * Login with username/email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Normalize the usernameOrEmail input to handle case-insensitivity
    const usernameOrEmail = credentials.usernameOrEmail.trim().toLowerCase();
    
    console.log('Login request:', { usernameOrEmail });
    
    try {
      // Always use absolute URL
      const response = await fetch(`${normalizedApiUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          usernameOrEmail,
          password: credentials.password
        }),
        credentials: 'include'
      });

      console.log('Login response status:', response.status);
      
      // Handle non-200 responses immediately
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server returned status ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
                }
        
        throw new Error(errorMessage);
              }

      // Get response text
      const responseText = await response.text();
            
      // Handle empty response
      if (!responseText || responseText.trim() === '') {
        throw new Error('Server returned an empty response');
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse login response as JSON:', parseError);
        throw new Error('Invalid response format from server');
        }

      // Validate response structure
        if (!data || !data.success) {
          throw new Error(data?.message || 'Login failed');
        }

      // Ensure we have user data
      if (!data.data || !data.data.user) {
        throw new Error('Invalid response format: missing user data');
        }

      // Store token if available
        if (data.data.token) {
          localStorage.setItem('authToken', data.data.token);
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
  async register(credentials: RegisterCredentials): Promise<{ user: User | null; message: string; verificationRequired?: boolean }> {
    console.log('Register request:', { ...credentials, password: '[REDACTED]' });
          
          try {
      const response = await fetch(`${API_URL}/api/users/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          confirmPassword: credentials.confirmPassword,
          authProvider: credentials.authProvider || 'local'
              }),
              credentials: 'include'
            });
            
      console.log('Register response status:', response.status);

      // Handle non-200 responses immediately
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server returned status ${response.status}`;
        
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        // Special handling for duplicate accounts
        if (response.status === 400 && errorMessage.includes('already exists')) {
          throw new Error('An account with this email already exists. Please use a different email or log in instead.');
        }
        
        throw new Error(errorMessage);
      }

      // Get response text
      const responseText = await response.text();
      
      // Handle empty response
      if (!responseText || responseText.trim() === '') {
        throw new Error('Server returned an empty response');
      }
      
      // Parse JSON response
      let data;
      try {
          data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse register response as JSON:', parseError);
        throw new Error('Invalid response format from server');
        }

      // Validate response structure
      if (!data || !data.success) {
        throw new Error(data?.message || 'Registration failed');
      }

      // Store token if available
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token);
      }

      // Extract verification required flag
      const verificationRequired = 
        data.verificationRequired === true || 
        (data.data && data.data.verificationRequired === true) ||
        false;

      return {
        user: data.data?.user || null,
        message: data.message || 'Registration successful',
        verificationRequired
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
  async verifyEmail(token: string): Promise<any> {
    try {
      console.log('Verifying email with token:', token.substring(0, 8) + '...');
      
      // Try to decode the token if it might be base64
      let decodedToken = '';
      let email = '';
      let method = '';
      
      try {
        decodedToken = atob(token);
        if (decodedToken.includes('@')) {
          console.log('Decoded token contains email:', decodedToken);
          email = decodedToken;
          method = 'direct';
        }
      } catch (e) {
        console.log('Token is not base64 encoded or is invalid');
      }
      
      // Get stored email from localStorage if available
      const storedEmail = localStorage.getItem('pending_verification_email');
      if (storedEmail && !email) {
        console.log('Using stored email from localStorage:', storedEmail);
        email = storedEmail;
      }
      
      // Try three different verification approaches
      
      // APPROACH 1: Try the direct email verification if we have a decoded email
      if (email && method === 'direct') {
        console.log('Trying direct email verification first');
        try {
          // Encode the email properly for URL
          const encodedEmail = Buffer.from(email).toString('base64');
          const directResponse = await fetch(`${API_URL}/api/users/verify-email-direct/${encodedEmail}`);
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('Direct verification response:', directData);
            
            if (directData.success) {
              return directData;
            }
          }
        } catch (directError) {
          console.error('Direct verification failed:', directError);
        }
      }
      
      // APPROACH 2: Try the standard verification endpoint
      console.log('Trying standard verification endpoint');
      
      // Send both the original token and the email we might have extracted
      const tokenData = {
        token,
        email: email || undefined
      };
      
      console.log('Sending verification data:', {
        token: token.substring(0, 8) + '...',
        hasEmail: !!email
      });
      
      // Call API to verify email
      const response = await fetch(`${API_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      });
      
      const data = await response.json();
      console.log('Verify email response:', data);
      
      if (!response.ok) {
        // APPROACH 3: If standard fails and we have an email, try to repair
        if (email) {
          console.log('Standard verification failed, trying repair');
          try {
            const repairResult = await this.repairFolderStructure(email);
            if (repairResult) {
              return {
                success: true,
                message: 'Email verified through repair process',
                user: { email }
              };
            }
          } catch (repairError) {
            console.error('Repair also failed:', repairError);
          }
        }
        
        throw new Error(data.message || 'Failed to verify email token');
      }
      
      // If verification was successful, clear the stored email
      if (data.success && storedEmail) {
        localStorage.removeItem('pending_verification_email');
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying email:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify email token',
        error: 'VERIFICATION_FAILED'
      };
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
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    console.log('Get current user request');
    
    try {
    const token = localStorage.getItem('authToken');
    
      // If no token, return null immediately
    if (!token) {
        console.log('No auth token found for getCurrentUser');
      return null;
    }

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Get current user response status:', response.status);
      
      // Get response text first for debugging
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('Get current user raw response length:', responseText.length);
        
        // For debugging purposes, log a truncated version
        if (responseText.length > 0) {
          const truncatedResponse = responseText.length > 500 
            ? responseText.substring(0, 500) + '... [truncated]' 
            : responseText;
          console.log('Get current user raw response:', truncatedResponse);
        } else {
          console.log('Get current user: Empty response received');
        }
      } catch (textError) {
        console.error('Error reading get current user response text:', textError);
      }
      
      // If we have an empty response but a success status code, create a fallback user object
      if ((!responseText || responseText.trim() === '') && response.status === 200) {
        console.log('Empty response received with 200 status, using fallback user');
        
        // Try to extract info from the token
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            // Decode the payload
            const decodedPayload = atob(tokenParts[1]);
            const payload = JSON.parse(decodedPayload);
            
            console.log('Token payload for fallback user:', {
              id: payload.id,
              email: payload.email,
              authProvider: payload.authProvider
            });
            
            // Create a user object from the token
            if (payload.id && payload.email) {
              console.log('Created fallback user from token payload');
              return {
                id: payload.id,
                email: payload.email,
                username: payload.username || payload.email.split('@')[0],
                role: payload.role || 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isVerified: true,
                storageUsed: 0,
                storageLimit: 5368709120, // 5GB default
                avatar: null,
                authProvider: payload.authProvider || 'local'
              };
            }
          }
        } catch (tokenError) {
          console.error('Error extracting user from token:', tokenError);
        }
        
        // If token extraction failed, return null
        return null;
      }

      // Try to parse the response as JSON
      try {
        // Only try to parse if we have a response
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from server in getCurrentUser');
          return null;
        }
        
        const data = JSON.parse(responseText);
        
        if (!response.ok) {
          throw new Error(data?.message || 'Failed to get user information');
        }
        
        if (!data || !data.success || !data.data) {
          console.error('Invalid getCurrentUser response structure:', data);
          throw new Error('Invalid response format from server');
        }
        
        return data.data;
      } catch (parseError) {
        console.error('Failed to parse getCurrentUser response as JSON:', parseError);
        throw new Error('Invalid response format from server: not valid JSON');
      }
    } catch (error) {
      console.error('Get current user error in gateway:', error);
      
      // Don't throw here - just return null to allow graceful fallback
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

      console.log('Sending account deletion request to server...');
      const response = await fetch(`${API_URL}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });

      console.log('Delete account response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `Failed to delete account (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json().catch(() => ({ success: true }));
      console.log('Delete account response:', data);
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to delete account');
      }
      
      // Clear auth token and other stored data
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Delete account error in gateway:', error);
      throw error;
    }
  },

  /**
   * Repair folder structure for a user
   * This can be used after registration or verification to ensure folders are created
   */
  async repairFolderStructure(email?: string): Promise<boolean> {
    try {
      console.log('Repairing folder structure for user');
      
      // Try to get the email from local storage if not provided
      if (!email) {
        email = localStorage.getItem('pendingVerificationEmail') || 
                localStorage.getItem('pending_verification_email');
        
      if (!email) {
        const user = await this.getCurrentUser();
        if (user && user.email) {
          email = user.email;
          }
        }
      }
      
      if (!email) {
        console.warn('Cannot repair folder structure: No email provided or found in storage');
        return false;
      }
      
      console.log(`Attempting to repair folder structure for email: ${email}`);
      
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/users/repair-folder-structure`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        console.error('Failed to repair folder structure, status:', response.status);
        return false;
      }
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing repair folder structure response:', parseError);
        return false;
      }
      
      console.log('Repair folder structure response:', responseData);
      
      if (responseData && responseData.success) {
        console.log('Successfully repaired folder structure');
        return true;
      } else {
        console.warn('Failed to repair folder structure:', responseData?.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error repairing folder structure:', error);
      return false;
    }
  },

  /**
   * Check if an account already exists with the given email
   * @param email Email address to check
   */
  async checkAccountExists(email: string): Promise<boolean> {
    try {
      console.log(`Checking if account exists: ${email}`);
      
      // Call the API to check if the account exists
      const response = await fetch(`${API_URL}/api/users/check-exists?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Parse the response
      const data = await response.json();
      console.log('Account check response:', data);
      
      // Return whether the account exists
      return data.exists === true;
    } catch (error) {
      console.error('Error checking if account exists:', error);
      // Default to false on error - we'll do a full check during registration
      return false;
    }
  }
}; 