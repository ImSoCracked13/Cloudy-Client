import { createEffect } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { authService } from '../../../services/authService';
import { authStore } from '../../store/AuthStore';

interface User {
  id: string;
  username?: string;
  email: string;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define public routes where auth checking should be disabled
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/about',
  '/verification-pending',
  '/verify-email',
  '/error'
];

// Check if current path is a public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname) || 
         pathname.startsWith('/verify/') || 
         pathname.startsWith('/error');
};

export function useCurrentUser() {
  const location = useLocation();

  createEffect(async () => {
    const currentPath = location.pathname;
    
    // Skip auth checking if on public pages
    if (isPublicRoute(currentPath)) {
      console.log('Skipping auth check on public route:', currentPath);
      authStore.setUser(null);
      authStore.setCurrentUserLoading(false);
      authStore.setCurrentUserError(null);
      return;
    }

    // Only check auth on protected pages
    try {
      authStore.setCurrentUserLoading(true);
      authStore.setCurrentUserError(null);
      const currentUser = await authService.getCurrentUser();
      authStore.setUser(currentUser);
    } catch (err) {
      authStore.setCurrentUserError(err instanceof Error ? err.message : 'Failed to fetch user info');
      console.log('Auth check failed on protected route:', currentPath, err);
    } finally {
      authStore.setCurrentUserLoading(false);
    }
  });

  return {
    user: () => authStore.state.user,
    loading: () => authStore.state.currentUserLoading,
    error: () => authStore.state.currentUserError,
  };
}
