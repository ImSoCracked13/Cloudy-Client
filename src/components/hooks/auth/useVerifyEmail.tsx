import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

/**
 * Hook for email verification functionality
 */
export function useVerifyEmail() {

  const verifyEmail = async (token: string) => {
    authStore.setVerifyEmailLoading(true);
    authStore.setVerifyEmailError(null);

    try {
      console.log('Verifying email with token:', token.substring(0, 10) + '...');
      const result = await authService.verifyEmail(token);
      console.log('Email verification result:', result);
      authStore.setVerifyEmailLoading(false);
      return result;
    } catch (error) {
      console.error('Email verification error:', error);
      authStore.setVerifyEmailError(error instanceof Error ? error.message : 'Failed to verify email');
      return false;
    }
  };

  return {
    verifyEmail,
    loading: () => authStore.state.verifyEmailLoading,
    error: () => authStore.state.verifyEmailError,
  };
}
