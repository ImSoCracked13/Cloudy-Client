import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

/**
 * Hook for logout functionality
 */
export function useLogout() {
  
  const logout = async () => {
    authStore.setLogoutLoading(true);
    
    try {
      await authService.logout();
      authStore.setUser(null);
      authStore.setLogoutLoading(false);
      return true;
    } catch (error) {
      authStore.setLogoutError(error instanceof Error ? error.message : 'Logout failed');
      return false;
    }
  };
  
  return {
    logout,
    loading: () => authStore.state.logoutLoading,
    error: () => authStore.state.logoutError
  };
} 