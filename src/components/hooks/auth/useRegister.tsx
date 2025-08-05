import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

/**
 * Hook for registration functionality
 */
export function useRegister() {
  
  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    // Basic validation
    if (!username || !email || !password) {
      authStore.setRegisterError('All fields are required');
      return { success: false, verificationRequired: false };
    }
    
    if (password !== confirmPassword) {
      authStore.setRegisterError('Passwords do not match');
      return { success: false, verificationRequired: false };
    }
    
    authStore.setRegisterLoading(true);
    authStore.setRegisterError(null);
    
    try {
      const result = await authService.register(username, email, password);
      
      return {
        success: true,
        verificationRequired: result.verificationRequired || false,
        message: result.message || 'Registration successful',
        user: result.user || null
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      authStore.setRegisterError(errorMessage);
      return { 
        success: false, 
        verificationRequired: false,
        message: errorMessage
      };
    } finally {
      authStore.setRegisterLoading(false);
    }
  };
  
  return {
    register,
    loading: () => authStore.state.registerLoading,
    error: () => authStore.state.registerError
  };
}
