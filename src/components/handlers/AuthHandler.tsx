import { Component, createContext, useContext, createEffect } from 'solid-js';

import { useTheme } from '../hooks/auth/useTheme';
import { useLogin } from '../hooks/auth/useLogin';
import { useRegister } from '../hooks/auth/useRegister';
import { useLogout } from '../hooks/auth/useLogout';
import { useGoogleAuth } from '../hooks/auth/useGoogleAuth';
import { useVerifyEmail } from '../hooks/auth/useVerifyEmail';
import { useSendEmail } from '../hooks/auth/useSendEmail';
import { useDeleteAccount } from '../hooks/auth/useDeleteAccount';
import { useCurrentUser } from '../hooks/auth/useCurrentUser';

interface AuthHandlerProps {
  onAuthStateChange?: (isAuthenticated: boolean) => void;
  children?: any;
}

// Define User interface
export interface User {
  id: string;
  email: string;
  username?: string;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define AuthContextValue interface
export interface AuthContextValue {
  // User state
  user: () => User | null;
  loading: () => boolean;
  error: () => string | null;
  
  // Theme management
  theme: () => string;
  toggleTheme: () => void;
  
  // Auth operations
  login: (usernameOrEmail: string, password: string) => Promise<User | null>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<any>;
  logout: () => Promise<boolean>;
  googleAuth: (response: any) => Promise<User | null>;
  verifyEmail: (token: string) => Promise<boolean>;
  sendVerificationEmail: (email: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
}

// Create context for auth handling
const AuthContext = createContext<AuthContextValue>();

// Create and export the auth context hook
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthHandler');
  }
  return context;
}

// Export the primary hook with the desired name
export { useAuth as useAuthHandler };

export const AuthHandler: Component<AuthHandlerProps> = (props) => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, error } = useCurrentUser();
  const { login } = useLogin();
  const { register } = useRegister();
  const { logout } = useLogout();
  const { googleAuth } = useGoogleAuth();
  const { verifyEmail } = useVerifyEmail();
  const { sendVerificationEmail } = useSendEmail();
  const { deleteAccount } = useDeleteAccount();

  // Make sure theme changes are reflected
  createEffect(() => {
  });

  const value: AuthContextValue = {
    user,
    loading,
    error,
    theme,
    toggleTheme,
    login,
    register,
    logout,
    googleAuth,
    verifyEmail,
    sendVerificationEmail,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      <div class={theme() === 'neon' ? 'neon-theme' : 'theme-dark'}>
          {props.children}
      </div>
    </AuthContext.Provider>
  );
};
