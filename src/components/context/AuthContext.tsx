import { createContext, useContext, createSignal, createEffect, onMount, onCleanup, ParentComponent } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import { authService } from '../services/authService';
import { User, GoogleAuthResponse } from '../types/userType';
import { fileGateway } from '../gateway/fileGateway';
import { notificationService } from '../common/Notification';

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | null = null;
  let isRunning = false;
 
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    // Prevent concurrent executions
    if (isRunning) {
      return;
    }
    
    timeoutId = window.setTimeout(async () => {
      isRunning = true;
      try {
        await fn(...args);
      } catch (error) {
        console.error('Error in debounced function:', error);
      } finally {
        isRunning = false;
      timeoutId = null;
      }
    }, delay);
  };
};

// Define auth context state type
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
  resetInactivityTimer: () => void;
  checkAuth: () => Promise<boolean>;
  debouncedCheckAuth: () => void;
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
  handleGoogleLogin: async () => null,
  resetInactivityTimer: () => {},
  checkAuth: async () => false,
  debouncedCheckAuth: () => {}
});

// Auth provider component
export const AuthProvider: ParentComponent = (props) => {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [user, setUser] = createSignal<User | null>(null);
  const [authCheckTimeout, setAuthCheckTimeout] = createSignal<number | null>(null);
  const navigate = useNavigate();
  let inactivityTimer: number | null = null;
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
  let lastAuthCheckTime = 0; // Track last auth check time
  let isCheckingAuth = false; // Flag to prevent concurrent auth checks
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = createSignal(false);
  
  // Create a reactive store for auth state
  const [state, setState] = createStore<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    // Prevent concurrent auth checks
    if (isCheckingAuth) {
      console.log('Auth check already in progress, skipping');
      return state.isAuthenticated;
    }
    
    try {
      isCheckingAuth = true;
      
      // Skip recent login/logout checks for initial auth check
      if (initialAuthCheckComplete()) {
        // Check if there was a recent login
        const recentLogin = localStorage.getItem('recent_login');
        if (recentLogin) {
          const loginTime = parseInt(recentLogin);
          // If login happened within the last 5 seconds, skip auth check
          if (Date.now() - loginTime < 5000) {
            console.log('Recent login detected, skipping auth check');
            return state.isAuthenticated;
          }
        }
        
        // Check if there was a recent logout
        const recentLogout = localStorage.getItem('recent_logout');
        if (recentLogout) {
          const logoutTime = parseInt(recentLogout);
          // If logout happened within the last 5 seconds, skip auth check
          if (Date.now() - logoutTime < 5000) {
            console.log('Recent logout detected, skipping auth check');
            setState({ isAuthenticated: false, user: null, isLoading: false, error: null });
            return false;
          }
        }
      }
      
      const user = await authService.getCurrentUser();
      console.log('Auth check result:', user ? 'Authenticated' : 'Not authenticated');
      
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null
      });

      if (!initialAuthCheckComplete()) {
        setInitialAuthCheckComplete(true);
      }
      
      return !!user;
    } catch (error) {
      console.error('Auth check error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });

      if (!initialAuthCheckComplete()) {
        setInitialAuthCheckComplete(true);
      }

      return false;
    } finally {
      isCheckingAuth = false;
    }
  };
  
  // Create a debounced version of checkAuth with a longer delay
  const debouncedCheckAuth = debounce(async () => {
    // Prevent excessive auth checks (minimum 3 seconds between checks)
    const now = Date.now();
    if (now - lastAuthCheckTime < 3000) {
      return;
    }
    lastAuthCheckTime = now;
    await checkAuth();
  }, 1000);
  
  // Reset inactivity timer function
  const resetInactivityTimer = () => {
    // Clear existing timer if any
    if (inactivityTimer !== null) {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    
    // Skip if persistent login is enabled
    if (localStorage.getItem('persistentLogin') === 'true') {
      return;
    }
    
    // Set a new timer
      inactivityTimer = window.setTimeout(() => {
      console.log('User inactive, logging out...');
        logout();
      }, INACTIVITY_TIMEOUT);
  };
  
  // Setup activity listeners to reset inactivity timer
  const setupActivityListeners = () => {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserActivity = () => {
      const sessionExpiryTime = localStorage.getItem('sessionExpiryTime');
      
      if (sessionExpiryTime) {
        const expiryTime = parseInt(sessionExpiryTime, 10);
        const now = Date.now();
        
        // If session hasn't expired yet, reset timer
        if (now < expiryTime || localStorage.getItem('persistentLogin') === 'true') {
      resetInactivityTimer();
          localStorage.setItem('sessionExpiryTime', (now + INACTIVITY_TIMEOUT).toString());
        }
      }
    };
    
    // Add event listeners
    activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
    
    // Return cleanup function
    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
      if (inactivityTimer !== null) {
        window.clearTimeout(inactivityTimer);
      }
    };
  };
  
  // Initialize last active timestamp from localStorage
  const initializeSessionData = () => {
    // Always enable persistent login by default
    if (!localStorage.getItem('persistentLogin')) {
      localStorage.setItem('persistentLogin', 'true');
    }
    
    // Check if we have a stored session expiry time
    const sessionExpiryTime = localStorage.getItem('sessionExpiryTime');
    
    if (sessionExpiryTime) {
      const expiryTime = parseInt(sessionExpiryTime, 10);
      const now = Date.now();
      
      // If session has expired, clear it only if persistent login is not enabled
      if (now > expiryTime && localStorage.getItem('persistentLogin') !== 'true') {
        console.log('Stored session expired, clearing data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('sessionExpiryTime');
      } else {
        // If not expired or persistent login is enabled, update the expiry time
        const newExpiryTime = now + INACTIVITY_TIMEOUT;
        localStorage.setItem('sessionExpiryTime', newExpiryTime.toString());
      }
    } else if (localStorage.getItem('authToken')) {
      // If we have a token but no expiry time, set one
      const newExpiryTime = Date.now() + INACTIVITY_TIMEOUT;
      localStorage.setItem('sessionExpiryTime', newExpiryTime.toString());
    }
  };
  
  // Initial auth check
  onMount(async () => {
    console.log('Performing initial auth check');
    await checkAuth();
  });
  
  // Setup periodic auth checks
  createEffect(() => {
    if (!initialAuthCheckComplete()) {
      return; // Skip until initial auth check is complete
    }

    const interval = setInterval(() => {
    debouncedCheckAuth();
    }, 60000); // Check every minute
    
    onCleanup(() => {
      clearInterval(interval);
    });
  });
  
  const login = async (usernameOrEmail: string, password: string): Promise<User | null> => {
    try {
      setState('isLoading', true);
      setState('error', null);
      
        const user = await authService.login(usernameOrEmail, password);
        
            if (user) {
        setState({
          user,
          isAuthenticated: true,
          error: null
        });
              return user;
            }
      
      setState({
        user: null,
        isAuthenticated: false,
        error: 'Login failed'
      });
      return null;
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      return null;
    } finally {
      setState('isLoading', false);
    }
  };
  
  const register = async (username: string, email: string, password: string): Promise<{ user: User | null; verificationRequired: boolean }> => {
    try {
      setState('isLoading', true);
      setState('error', null);
      
      const result = await authService.register(username, email, password);
      
      const needsVerification = 
        result.verificationRequired || 
        (result.user?.authProvider === 'local' && !result.user?.isVerified) ||
        (result.message && result.message.toLowerCase().includes('verification'));
      
      if (result.user && !needsVerification) {
        setState({
          user: result.user,
          isAuthenticated: true,
          error: null
        });
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          error: null
        });
      }
      
      return { 
        user: result.user, 
        verificationRequired: needsVerification 
      };
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
      return { user: null, verificationRequired: false };
    } finally {
      setState('isLoading', false);
    }
  };
  
  const logout = async () => {
    try {
      setState('isLoading', true);
      setState('error', null);
      
      await authService.logout();
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('sessionExpiryTime');
      localStorage.removeItem('persistentLogin');
      localStorage.setItem('recent_logout', Date.now().toString());
      
      if (inactivityTimer !== null) {
        window.clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      
      setState({
        user: null,
        isAuthenticated: false,
        error: null
      });
      
      navigate('/login');
    } catch (error) {
      setState('error', error instanceof Error ? error.message : 'Logout failed');
    } finally {
      setState('isLoading', false);
    }
  };
  
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const success = await authService.verifyEmail(token);
      
      if (success) {
        // If user is already logged in, refresh user data
        if (isAuthenticated() && user()) {
          const user = await authService.getCurrentUser();
          if (user) {
            setUser(user);
            // Reset inactivity timer since user is active
            resetInactivityTimer();
          }
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
      
      return success;
    } catch (error) {
      console.error('Email verification error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const success = await authService.resendVerificationEmail(email);
      
      setIsLoading(false);
      
      // Reset inactivity timer since user is active
      resetInactivityTimer();
      
      return success;
    } catch (error) {
      console.error('Resend verification error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const success = await authService.requestPasswordReset(email);
      
      setIsLoading(false);
      
      // Reset inactivity timer since user is active
      resetInactivityTimer();
      
      return success;
    } catch (error) {
      console.error('Password reset request error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const success = await authService.resetPassword(token, newPassword);
      
      setIsLoading(false);
      
      return success;
    } catch (error) {
      console.error('Password reset error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const updatedUser = await authService.updateProfile(data);
      
      if (updatedUser) {
        setUser(updatedUser);
        
        // Reset inactivity timer since user is active
        resetInactivityTimer();
        
        return true;
      }
      
      setIsLoading(false);
      
      return false;
    } catch (error) {
      console.error('Update profile error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const success = await authService.changePassword(currentPassword, newPassword);
      
      setIsLoading(false);
      
      // Reset inactivity timer since user is active
      resetInactivityTimer();
      
      return success;
    } catch (error) {
      console.error('Change password error:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const handleGoogleLogin = async (response: any): Promise<User | null> => {
    try {
      setIsLoading(true);
      
      console.log('Google login response:', response);
      
      // Process Google auth response
      const result = await authService.googleLogin(response);
      
      if (result && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Set session expiry time
        const expiryTime = Date.now() + INACTIVITY_TIMEOUT;
        localStorage.setItem('sessionExpiryTime', expiryTime.toString());
        localStorage.setItem('persistentLogin', 'true');
        
        // Start inactivity timer
        resetInactivityTimer();
        
        return result.user;
      }
      
      setIsLoading(false);
      
      return null;
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
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
    handleGoogleLogin,
    resetInactivityTimer,
    checkAuth,
    debouncedCheckAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 