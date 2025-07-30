import { createStore } from 'solid-js/store';

/**
 * State management for authentication
 */
export interface User {
  id: string;
  username?: string;
  email: string;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  // User data
  user: User | null;
  
  // Loading states
  loginLoading: boolean;
  registerLoading: boolean;
  logoutLoading: boolean;
  deleteAccountLoading: boolean;
  googleAuthLoading: boolean;
  verifyEmailLoading: boolean;
  sendEmailLoading: boolean;
  currentUserLoading: boolean;
  
  // Error states
  loginError: string | null;
  registerError: string | null;
  logoutError: string | null;
  deleteAccountError: string | null;
  googleAuthError: string | null;
  verifyEmailError: string | null;
  sendEmailError: string | null;
  currentUserError: string | null;
  
  // Success states
  sendEmailSuccess: boolean;
  
  // Theme
  theme: 'dark' | 'neon';
}

// Create the auth store
const [authState, setAuthState] = createStore<AuthState>({
  // User data
  user: null,
  
  // Loading states
  loginLoading: false,
  registerLoading: false,
  logoutLoading: false,
  deleteAccountLoading: false,
  googleAuthLoading: false,
  verifyEmailLoading: false,
  sendEmailLoading: false,
  currentUserLoading: false,
  
  // Error states
  loginError: null,
  registerError: null,
  logoutError: null,
  deleteAccountError: null,
  googleAuthError: null,
  verifyEmailError: null,
  sendEmailError: null,
  currentUserError: null,
  
  // Success states
  sendEmailSuccess: false,
  
  // Theme
  theme: 'dark'
});

// Helper functions to update the store
export const authStore = {
  // State getter
  get state() {
    return authState;
  },
  
  // User actions
  setUser: (user: User | null) => {
    setAuthState('user', user);
  },
  
  clearUser: () => {
    setAuthState('user', null);
  },
  
  // Login actions
  setLoginLoading: (loading: boolean) => {
    setAuthState('loginLoading', loading);
    if (loading) setAuthState('loginError', null);
  },
  
  setLoginError: (error: string | null) => {
    setAuthState('loginError', error);
    setAuthState('loginLoading', false);
  },
  
  // Register actions
  setRegisterLoading: (loading: boolean) => {
    setAuthState('registerLoading', loading);
    if (loading) setAuthState('registerError', null);
  },
  
  setRegisterError: (error: string | null) => {
    setAuthState('registerError', error);
    setAuthState('registerLoading', false);
  },
  
  // Logout actions
  setLogoutLoading: (loading: boolean) => {
    setAuthState('logoutLoading', loading);
    if (loading) setAuthState('logoutError', null);
  },
  
  setLogoutError: (error: string | null) => {
    setAuthState('logoutError', error);
    setAuthState('logoutLoading', false);
  },
  
  // Delete account actions
  setDeleteAccountLoading: (loading: boolean) => {
    setAuthState('deleteAccountLoading', loading);
    if (loading) setAuthState('deleteAccountError', null);
  },
  
  setDeleteAccountError: (error: string | null) => {
    setAuthState('deleteAccountError', error);
    setAuthState('deleteAccountLoading', false);
  },
  
  // Google auth actions
  setGoogleAuthLoading: (loading: boolean) => {
    setAuthState('googleAuthLoading', loading);
    if (loading) setAuthState('googleAuthError', null);
  },
  
  setGoogleAuthError: (error: string | null) => {
    setAuthState('googleAuthError', error);
    setAuthState('googleAuthLoading', false);
  },
  
  // Verify email actions
  setVerifyEmailLoading: (loading: boolean) => {
    setAuthState('verifyEmailLoading', loading);
    if (loading) setAuthState('verifyEmailError', null);
  },
  
  setVerifyEmailError: (error: string | null) => {
    setAuthState('verifyEmailError', error);
    setAuthState('verifyEmailLoading', false);
  },
  
  // Send email actions
  setSendEmailLoading: (loading: boolean) => {
    setAuthState('sendEmailLoading', loading);
    if (loading) {
      setAuthState('sendEmailError', null);
      setAuthState('sendEmailSuccess', false);
    }
  },
  
  setSendEmailError: (error: string | null) => {
    setAuthState('sendEmailError', error);
    setAuthState('sendEmailLoading', false);
    setAuthState('sendEmailSuccess', false);
  },
  
  setSendEmailSuccess: (success: boolean) => {
    setAuthState('sendEmailSuccess', success);
    if (success) {
      setAuthState('sendEmailError', null);
      setAuthState('sendEmailLoading', false);
    }
  },
  
  // Current user actions
  setCurrentUserLoading: (loading: boolean) => {
    setAuthState('currentUserLoading', loading);
    if (loading) setAuthState('currentUserError', null);
  },
  
  setCurrentUserError: (error: string | null) => {
    setAuthState('currentUserError', error);
    setAuthState('currentUserLoading', false);
  },
  
  // Theme actions
  setTheme: (theme: 'dark' | 'neon') => {
    setAuthState('theme', theme);
  },
  
  // Clear all errors
  clearAllErrors: () => {
    setAuthState({
      loginError: null,
      registerError: null,
      logoutError: null,
      deleteAccountError: null,
      googleAuthError: null,
      verifyEmailError: null,
      sendEmailError: null,
      currentUserError: null
    });
  },
  
  // Reset all loading states
  resetAllLoading: () => {
    setAuthState({
      loginLoading: false,
      registerLoading: false,
      logoutLoading: false,
      deleteAccountLoading: false,
      googleAuthLoading: false,
      verifyEmailLoading: false,
      sendEmailLoading: false,
      currentUserLoading: false
    });
  }
};

export default authStore;