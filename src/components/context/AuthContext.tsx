import { createContext, useContext, JSX, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import { notificationService } from '../common/Notification';
import { authService } from '../services/authService';
import { User, GoogleAuthResponse } from '../types/user';

// Define the auth state
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define the auth context type
interface AuthContextValue {
  state: AuthContextState;
  login: (usernameOrEmail: string, password: string) => Promise<User | null>;
  register: (username: string, email: string, password: string) => Promise<{ user: User | null; verificationRequired: boolean }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  handleGoogleLogin: (response: any) => Promise<User | null>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextValue>({
  state: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  },
  login: async () => null,
  register: async () => ({ user: null, verificationRequired: false }),
  logout: async () => {},
  verifyEmail: async () => false,
  resendVerificationEmail: async () => false,
  requestPasswordReset: async () => false,
  resetPassword: async () => false,
  updateProfile: async () => false,
  changePassword: async () => false,
  handleGoogleLogin: async () => null
});

// Auth provider component
export function AuthProvider(props: { children: JSX.Element }) {
  const navigate = useNavigate();
  
  // Create a reactive store for auth state
  const [state, setState] = createStore<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  // Check auth status on mount
  createEffect(() => {
    checkAuth();
  });
  
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }
      
      const user = await authService.getCurrentUser();
      
      if (user) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        localStorage.removeItem('authToken');
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  };
  
  const login = async (usernameOrEmail: string, password: string): Promise<User | null> => {
    try {
      setState({ isLoading: true, error: null });
      
      const user = await authService.login(usernameOrEmail, password);
      
      if (user) {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        return user;
      }
      
      setState({
        isLoading: false,
        error: 'Login failed. Please check your credentials.'
      });
      
      return null;
    } catch (error) {
      console.error('Login error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      return null;
    }
  };
  
  const register = async (username: string, email: string, password: string): Promise<{ user: User | null; verificationRequired: boolean }> => {
    try {
      setState({ isLoading: true, error: null });
      
      const result = await authService.register(username, email, password);
      
      if (result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setState({ isLoading: false });
      }
      
      return { user: result.user, verificationRequired: result.verificationRequired };
    } catch (error) {
      console.error('Registration error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
      return { user: null, verificationRequired: false };
    }
  };
  
  const logout = async () => {
    try {
      setState({ isLoading: true, error: null });
      
      await authService.logout();
      
      localStorage.removeItem('authToken');
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      });
    }
  };
  
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const success = await authService.verifyEmail(token);
      
      if (success) {
        // If user is already logged in, refresh user data
        if (state.isAuthenticated && state.user) {
          const user = await authService.getCurrentUser();
          if (user) {
            setState({
              user,
              isLoading: false,
              error: null
            });
          }
        } else {
          setState({ isLoading: false, error: null });
        }
      } else {
        setState({
          isLoading: false,
          error: 'Email verification failed. Please try again or request a new verification link.'
        });
      }
      
      return success;
    } catch (error) {
      console.error('Email verification error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Email verification failed'
      });
      return false;
    }
  };
  
  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const success = await authService.resendVerificationEmail(email);
      
      setState({
        isLoading: false,
        error: success ? null : 'Failed to resend verification email'
      });
      
      return success;
    } catch (error) {
      console.error('Resend verification error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification email'
      });
      return false;
    }
  };
  
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const success = await authService.requestPasswordReset(email);
      
      setState({ isLoading: false });
      
      return success;
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to request password reset'
      });
      
      return false;
    }
  };
  
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const success = await authService.resetPassword(token, newPassword);
      
      setState({ isLoading: false });
      
      return success;
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      });
      
      return false;
    }
  };
  
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const updatedUser = await authService.updateProfile(data);
      
      if (updatedUser) {
        setState({
          user: updatedUser,
          isLoading: false
        });
        
        return true;
      }
      
      setState({ isLoading: false });
      return false;
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      });
      
      return false;
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setState({ isLoading: true, error: null });
      
      const success = await authService.changePassword(currentPassword, newPassword);
      
      setState({ isLoading: false });
      
      return success;
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to change password'
      });
      
      return false;
    }
  };
  
  const handleGoogleLogin = async (response: any): Promise<User | null> => {
    try {
      setState({ isLoading: true, error: null });
      
      if (!response || (!response.credential && !response.token)) {
        throw new Error('Invalid Google response');
      }
      
      console.log('Google login response received in AuthContext:', { 
        hasCredential: !!response.credential,
        hasToken: !!response.token,
        hasEmail: !!response.email,
        hasSub: !!response.sub
      });
      
      console.log('Calling authService.googleLogin...');
      const result = await authService.googleLogin(response);
      console.log('authService.googleLogin returned:', result ? {
        hasUser: !!result.user,
        hasToken: !!result.token,
        tokenLength: result.token ? result.token.length : 0
      } : 'null');
      
      if (!result) {
        throw new Error('Google login failed: No result from authService');
      }
      
      if (!result.user) {
        throw new Error('Google login failed: No user in result');
      }
      
      if (!result.token) {
        throw new Error('Google login failed: No token in result');
      }
      
      console.log('Google login successful, user:', { 
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        tokenLength: result.token.length
      });
      
      // Store the token
      console.log('Storing auth token, length:', result.token.length);
      localStorage.setItem('authToken', result.token);
      
      setState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return result.user;
    } catch (error) {
      console.error('Google login error in AuthContext:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google login failed'
      });
      return null;
    }
  };
  
  const value = {
    state,
    login,
    register,
    logout,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    handleGoogleLogin
  };
  
  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 