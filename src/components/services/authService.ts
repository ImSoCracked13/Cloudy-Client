import { User, GoogleAuthResponse } from '../types/userType';
import { notificationService } from '../common/Notification';
import { authGateway } from '../gateway/authGateway';

// Add an interface for RegisterResult to properly type the response
interface RegisterResult {
  user?: any;
  token?: string;
  message?: string;
  verificationRequired?: boolean;
}

/**
 * Auth Service - Handles authentication business logic
 */
export const authService = {
  /**
   * Login with username or email and password
   */
  async login(usernameOrEmail: string, password: string): Promise<User | null> {
    try {
      const user = await authGateway.login({ usernameOrEmail, password });
      return user;
    } catch (error) {
      console.error('Login error in service:', error);
      notificationService.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  },
  
  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<any> {
    try {
      console.log('Registering user:', { username, email });
      
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
      
      console.log('Register result:', result);
      
      // Set token if available
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      
      // Folder structure should already be created on the server side
      // but we'll verify it just to be safe
      if (result.user && result.user.id) {
        try {
          console.log('Verifying folder structure for new local user');
          
          // Add a small delay to ensure server has time to complete its operations
            setTimeout(async () => {
              try {
                const fileGw = await import('../gateway/fileGateway').then(m => m.fileGateway);
              const repairResult = await fileGw.repairFolderStructure();
              console.log('Folder structure verification result:', repairResult);
            } catch (error) {
              console.error('Error verifying folder structure:', error);
              }
          }, 2000);
        } catch (folderError) {
          console.error('Failed to verify folder structure after registration:', folderError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Registration error in service:', error);
      notificationService.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  },
  
  /**
   * Google authentication
   */
  async googleAuth(response: GoogleAuthResponse): Promise<User> {
    try {
      const result = await authGateway.googleAuth(response);
      if (!result || !result.user) throw new Error('Google authentication failed');
      return result.user;
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Google authentication failed');
      throw error;
    }
  },
  
  /**
   * Google login with full response
   */
  async googleLogin(response: GoogleAuthResponse): Promise<{ user: User; token: string } | null> {
    try {
      const result = await authGateway.googleAuth(response);
      
      // Check for valid response
      if (!result || !result.user) {
        console.error('Invalid response from googleAuth:', result);
        throw new Error('Google authentication failed: Invalid response');
      }
      
      // Log success for debugging
      console.log('Google login successful:', { 
        userId: result.user.id,
        hasToken: !!result.token
      });
      
      // Show success notification
      notificationService.success('Successfully logged in with Google');
      
      return result;
    } catch (error) {
      console.error('Google login error in service:', error);
      notificationService.error(error instanceof Error ? error.message : 'Google authentication failed');
      throw error;
    }
  },
  
  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      return await authGateway.verifyEmail(token);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Email verification failed');
      throw error;
    }
  },
  
  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      return await authGateway.resendVerificationEmail(email);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to resend verification email');
      throw error;
    }
  },
  
  /**
   * Alias for resendVerificationEmail
   */
  async resendVerification(email: string): Promise<boolean> {
    return this.resendVerificationEmail(email);
  },
  
  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      return await authGateway.requestPasswordReset(email);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to request password reset');
      throw error;
    }
  },
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      return await authGateway.resetPassword(token, newPassword);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to reset password');
      throw error;
    }
  },
  
  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await authGateway.getCurrentUser();
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },
  
  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      return await authGateway.updateProfile(userData);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  },
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      return await authGateway.changePassword(currentPassword, newPassword);
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to change password');
      throw error;
    }
  },
  
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await authGateway.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token on error
      localStorage.removeItem('authToken');
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<boolean> {
    try {
      const result = await authGateway.deleteAccount(password);
      
      if (result) {
        notificationService.success('Account deleted successfully!');
      }
      
      return result;
    } catch (error) {
      notificationService.error(error instanceof Error ? error.message : 'Failed to delete account');
      throw error;
    }
  },
}; 