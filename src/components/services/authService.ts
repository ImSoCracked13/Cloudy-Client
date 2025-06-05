import { User, GoogleAuthResponse } from '../types/user';
import { notificationService } from '../common/Notification';
import { authGateway } from '../gateway/authGateway';

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
      notificationService.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  },
  
  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<{ user: User | null; verificationRequired: boolean }> {
    try {
      const result = await authGateway.register({ 
        username, 
        email, 
        password, 
        confirmPassword: password,
        authProvider: 'local'
      });
      
      // Determine if verification is required:
      // 1. Check message for verification text
      // 2. Check if user exists but is not verified (for local auth)
      const messageIndicatesVerification = result.message.toLowerCase().includes('verification') || 
                                           result.message.toLowerCase().includes('check your email');
      const userNeedsVerification = result.user && 
                                    result.user.authProvider === 'local' && 
                                    result.user.isVerified === false;
      
      const verificationRequired = messageIndicatesVerification || userNeedsVerification;
      
      console.log('Registration result verification check:', {
        messageIndicatesVerification,
        userNeedsVerification,
        verificationRequired,
        userAuthProvider: result.user?.authProvider,
        userIsVerified: result.user?.isVerified
      });
      
      return { 
        user: result.user, 
        verificationRequired 
      };
    } catch (error) {
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