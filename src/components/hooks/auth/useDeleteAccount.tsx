import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

/**
 * Hook for account deletion functionality
 */
export function useDeleteAccount() {

  const deleteAccount = async (password: string) => {
    if (!password) {
      authStore.setDeleteAccountError('Password is required');
      return false;
    }

    authStore.setDeleteAccountLoading(true);

    try {
      const result = await authService.deleteAccount(password);
      authStore.setDeleteAccountLoading(false);
      return result;
    } catch (error) {
      authStore.setDeleteAccountError(error instanceof Error ? error.message : 'Failed to delete account');
      return false;
    }
  };

  return {
    deleteAccount,
    loading: () => authStore.state.deleteAccountLoading,
    error: () => authStore.state.deleteAccountError
  };
}
