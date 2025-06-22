import { useNavigate } from '@solidjs/router';
import { createEffect, JSX, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import Spinner from '../widgets/Spinner';

interface ProtectedRouteProps {
  children: JSX.Element;
  fallback?: JSX.Element;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const { state, debouncedCheckAuth } = useAuth();
  const navigate = useNavigate();
  const [authCheckComplete, setAuthCheckComplete] = createSignal(false);
  const [redirectTimer, setRedirectTimer] = createSignal<number | null>(null);
  const [authAttempts, setAuthAttempts] = createSignal(0);
  const [lastAuthCheck, setLastAuthCheck] = createSignal(0);
  const [isProcessingAuth, setIsProcessingAuth] = createSignal(false);

  // Debounced auth check to prevent excessive calls
  const debouncedLocalCheck = () => {
    const now = Date.now();
    // Only allow auth checks every 3 seconds
    if (now - lastAuthCheck() < 3000 || isProcessingAuth()) {
      return;
    }
    
    setIsProcessingAuth(true);
    setLastAuthCheck(now);
    
    try {
      debouncedCheckAuth();
    } catch (e) {
      console.error('Error during auth check:', e);
    } finally {
      // Reset processing flag after a short delay to prevent immediate rechecks
      setTimeout(() => setIsProcessingAuth(false), 500);
    }
  };

  // On mount, check authentication with a delay to prevent immediate logout
  onMount(() => {
    // Check if there was a recent logout
    const recentLogout = localStorage.getItem('recent_logout');
    if (recentLogout) {
      const logoutTime = parseInt(recentLogout);
      const now = Date.now();
      // If logout happened within the last 3 seconds, skip auth check
      if (now - logoutTime < 3000) {
        setAuthCheckComplete(true);
        // Navigate to login immediately
        navigate('/login', { replace: true });
        return;
      }
    }
    
    // Check for fresh login via localStorage flag
    const recentLogin = localStorage.getItem('recent_login');
    const lastLogin = localStorage.getItem('last_successful_login');
    
    if (recentLogin) {
      const loginTime = parseInt(recentLogin);
      // If login was very recent (within 5 seconds), trust it without additional checks
      if (Date.now() - loginTime < 5000) {
        console.log('Recent login detected in ProtectedRoute, assuming authenticated');
        setAuthCheckComplete(true);
        return;
      }
    }
    
    if (lastLogin) {
      const loginTime = new Date(lastLogin).getTime();
      const now = new Date().getTime();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      if (loginTime > fiveMinutesAgo) {
        setAuthCheckComplete(true);
        return;
      }
    }
    
    // Force a manual auth check with a delay
    setTimeout(() => {
    debouncedLocalCheck();
    }, 1000);
  });

  // Clean up any timers when component unmounts
  onCleanup(() => {
    if (redirectTimer()) {
      window.clearTimeout(redirectTimer());
    }
  });

  // Check authentication status and handle redirects appropriately
  createEffect(() => {
    // Skip if we're currently processing an auth check
    if (isProcessingAuth()) {
      return;
    }
    
    // Check if there was a recent logout
    const recentLogout = localStorage.getItem('recent_logout');
    if (recentLogout) {
      const logoutTime = parseInt(recentLogout);
      const now = Date.now();
      // If logout happened within the last 3 seconds, skip auth check
      if (now - logoutTime < 3000) {
        if (redirectTimer()) {
          window.clearTimeout(redirectTimer());
          setRedirectTimer(null);
        }
        return;
      }
    }
    
    // Check for fresh login first
    const recentLogin = localStorage.getItem('recent_login');
    if (recentLogin) {
      const loginTime = parseInt(recentLogin);
      // If login was very recent (within 5 seconds), trust it without additional checks
      if (Date.now() - loginTime < 5000) {
        return; // Trust the recent login
      }
    }
    
    const hasToken = localStorage.getItem('authToken') !== null;
    const lastLogin = localStorage.getItem('last_successful_login');
    const recentLoginTime = lastLogin && (new Date(lastLogin).getTime() > (Date.now() - 5 * 60 * 1000));
    
    // Clear any existing redirect timer
    if (redirectTimer()) {
      window.clearTimeout(redirectTimer());
      setRedirectTimer(null);
    }
    
    // If authentication check is complete
    if (!state.isLoading) {
      setAuthCheckComplete(true);
      
      // If authenticated, we're good to go
      if (state.isAuthenticated) {
        return;
      }
      
      // If there was a recent login, give it more time, but limit attempts
      if (recentLoginTime && authAttempts() < 3) {
        const timer = window.setTimeout(() => {
          setAuthAttempts(prev => prev + 1);
          debouncedLocalCheck();
        }, 3000); // Increased delay to reduce frequency
        
        setRedirectTimer(timer);
        return;
      }
      
      // If no token exists at all, redirect immediately
      if (!hasToken) {
        navigate('/login', { replace: true });
        return;
      }
      
      // If we have a token but not authenticated, it might be that the token validation
      // is still in progress or failed. Wait briefly before redirecting.
      if (authAttempts() < 3) {  // Maximum 3 attempts
        const timer = window.setTimeout(() => {
          setAuthAttempts(prev => prev + 1);
          debouncedLocalCheck();
        }, 3000); // Increased delay to 3 seconds
        
        setRedirectTimer(timer);
      } else {
        // After max attempts, redirect to login
        navigate('/login', { replace: true });
      }
    }
  });

  // Allow showing the content if:
  // 1. User is authenticated via state, OR
  // 2. User has a token AND it's the first render/auth check is in progress, OR
  // 3. User had a recent login (within 5 minutes), OR
  // 4. User has a very recent login flag set
  const hasToken = localStorage.getItem('authToken') !== null;
  const lastLogin = localStorage.getItem('last_successful_login');
  const recentLoginTime = lastLogin && (new Date(lastLogin).getTime() > (Date.now() - 5 * 60 * 1000));
  const veryRecentLogin = localStorage.getItem('recent_login') && 
                          (Date.now() - parseInt(localStorage.getItem('recent_login') || '0') < 5000);
  
  const shouldShowContent = state.isAuthenticated || 
                            (hasToken && !authCheckComplete()) ||
                            recentLoginTime ||
                            veryRecentLogin;
  
  return (
    <Show
      when={shouldShowContent}
      fallback={props.fallback || (
        <div class="flex justify-center items-center h-screen bg-background">
          <Spinner size="lg" />
        </div>
      )}
    >
      {props.children}
    </Show>
  );
} 