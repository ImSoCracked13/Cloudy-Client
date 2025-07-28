import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

/**
 * Hook for registration functionality
 */
export function useRegister() {
  
  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    // Validate inputs
    if (!username || !email || !password) {
      authStore.setRegisterError('All fields are required');
      return { user: null, verificationRequired: false };
    }
    
    if (password !== confirmPassword) {
      authStore.setRegisterError('Passwords do not match');
      return { user: null, verificationRequired: false };
    }
    
    authStore.setRegisterLoading(true);
    
    try {
      const result = await authService.register(username, email, password);
      
      // Normalize the response to a standard format
      const normalizedResult = {
        // Check for success flag
        success: result.success === true || !!result.user || !!result.data,
        // Get user from different possible locations
        user: result.user || (result.data && result.data.user) || null,
        // Check if verification is required
        verificationRequired: 
          result.verificationRequired === true || 
          (result.message && typeof result.message === 'string' && result.message.toLowerCase().includes('verify')),
        // Pass along original message and data
        message: result.message || '',
        data: result.data || {}
      };
      
      authStore.setRegisterLoading(false);
      return normalizedResult;
    } catch (error) {
      console.error('Registration error in hook:', error);
      authStore.setRegisterError(error instanceof Error ? error.message : 'Registration failed');
      return { 
        success: false,
        user: null, 
        verificationRequired: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };
  
  return {
    register,
    loading: () => authStore.state.registerLoading,
    error: () => authStore.state.registerError
  };
}
