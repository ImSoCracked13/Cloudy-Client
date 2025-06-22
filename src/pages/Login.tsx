import { createSignal, Show, onMount } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../components/context/AuthContext';
import { notificationService } from '../components/common/Notification';

// Define proper interface for login result
interface LoginResult {
  success?: boolean;
  user?: any;
  needsVerification?: boolean;
  message?: string;
}

export default function Login() {
  const { login, resendVerificationEmail, state } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [currentEmail, setCurrentEmail] = createSignal('');
  const [needsVerification, setNeedsVerification] = createSignal(false);
  const [resendingVerification, setResendingVerification] = createSignal(false);
  const [loginSuccess, setLoginSuccess] = createSignal(false);

  // Check if user is already logged in
  onMount(() => {
    // Clear the recent logout flag if it exists
    localStorage.removeItem('recent_logout');
    
    // Check if we have a token, if so, redirect to drive
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('Auth token found on mount, redirecting to drive');
      window.location.href = '/drive';
      return;
    }
    
    // Check if user is already authenticated in the state
    if (state.isAuthenticated && state.user) {
      console.log('User already authenticated in state, redirecting to drive');
      window.location.href = '/drive';
    }
  });

  // Function to safely redirect after login
  const redirectToDrive = () => {
    // Set success state for UI
    setLoginSuccess(true);
    
    // Store login timestamp
    localStorage.setItem('last_successful_login', new Date().toISOString());
    
    // Clear any error that might have been set
    setError('');
    
    // Force a hard redirect
    console.log('Forcing hard redirect to /drive after successful login');
    setTimeout(() => {
      window.location.href = '/drive';
    }, 800);
  };

  const handleSubmit = async (email: string, password: string) => {
    setError('');
    setIsSubmitting(true);
    setCurrentEmail(email);
    setNeedsVerification(false);
    setLoginSuccess(false);
    
    try {
      console.log('Attempting login for user:', email);
      
      // Normalize the input - trim whitespace
      const normalizedInput = email.trim();
      
      // Get authGateway directly to check login response
      const { authGateway } = await import('../components/gateway/authGateway');
      
      try {
        // Make direct API call to check the response
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            usernameOrEmail: normalizedInput,
            password: password
          }),
          credentials: 'include'
        });
        
        // If the API call succeeds with status 200, immediately redirect
        if (response.status === 200) {
          console.log('Login API call succeeded with status 200');
          
          try {
            // Try to parse the response
            const responseText = await response.text();
            const data = JSON.parse(responseText);
            
            // If we have a token in the response, store it
            if (data?.data?.token) {
              console.log('Storing token from direct API call');
              localStorage.setItem('authToken', data.data.token);
            }
            
            // Show success notification
            notificationService.success('Login successful!');
            
            // Redirect regardless of parsing success
            redirectToDrive();
            return;
          } catch (parseError) {
            console.warn('Could not parse login response, but status was 200 - continuing');
            // Even if we can't parse, we got a 200 status, so continue with login
            notificationService.success('Login successful!');
            redirectToDrive();
            return;
          }
        }
      } catch (directApiError) {
        console.warn('Direct API call failed, falling back to authService:', directApiError);
        // Continue with the normal login flow below
      }
      
      // Fall back to normal login if direct API call fails
      const result = await login(normalizedInput, password) as LoginResult;
      console.log('Login result received');
      
      if (result && result.user) {
        console.log('Login successful, preparing to redirect');
        notificationService.success('Login successful!');
        
        // Store authentication info in localStorage for persistence
        localStorage.setItem('last_successful_login', new Date().toISOString());
        
        // Repair folder structure for the user
        try {
          console.log('Repairing folder structure');
          await authGateway.repairFolderStructure(normalizedInput);
        } catch (repairError) {
          console.error('Error repairing folder structure:', repairError);
          // Continue login even if repair fails
        }
        
        // Force a hard redirect instead of using navigate
        // This ensures a full page reload which refreshes the auth state
        console.log('Forcing hard redirect to /drive');
        setTimeout(() => {
          window.location.href = '/drive';
        }, 800);
      } else {
        // Check if login failed due to verification issues
        const errorMessage = state.error || '';
        if (errorMessage.toLowerCase().includes('verify')) {
          console.log('Login failed due to verification issue - showing resend option');
          setNeedsVerification(true);
          setError('Please verify your email before logging in');
        } else {
          // For other errors, show the error from the auth state
          setError(errorMessage || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Check if the error is verification-related
      if (errorMessage.toLowerCase().includes('verify')) {
        setNeedsVerification(true);
        setError('Please verify your email before logging in');
      } else if (errorMessage.toLowerCase().includes('json') || errorMessage.toLowerCase().includes('parse')) {
        setError('Server communication error. Please try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!currentEmail()) {
      setError('Email address is required to resend verification');
      return;
    }
    
    setResendingVerification(true);
    
    try {
      const result = await resendVerificationEmail(currentEmail());
      
      if (result) {
        notificationService.success('Verification email sent! Please check your inbox.');
        
        // Store email for verification pending page
        localStorage.setItem('pendingVerificationEmail', currentEmail());
        
        // Navigate to verification pending page
        navigate('/verification-pending');
      } else {
        setError('Failed to resend verification email. Please try again later.');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full space-y-8 bg-background-darker p-6 rounded-lg shadow-lg">
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-2">Welcome back</h1>
          <p class="text-text-muted">Sign in to your account</p>
        </div>
        
        <Show when={loginSuccess()}>
          <div class="bg-success/20 border border-success/30 text-success px-4 py-3 rounded">
            Login successful! Redirecting you to your files...
          </div>
        </Show>
        
        <Show when={error() && !loginSuccess()}>
          <div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded">
            {error()}
            
            {/* Show resend verification button when needed */}
            <Show when={needsVerification()}>
              <div class="mt-2">
                <button
                  type="button"
                  class="text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded text-sm font-medium disabled:opacity-70"
                  onClick={handleResendVerification}
                  disabled={resendingVerification()}
                >
                  {resendingVerification() ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </Show>
          </div>
        </Show>
        
        <AuthForm 
          type="login"
          onSubmit={handleSubmit}
          isLoading={isSubmitting() || state.isLoading}
        />
        
        <div class="text-center mt-6">
          <p class="text-text-muted">
            Don't have an account?{' '}
            <A href="/register" class="text-primary hover:underline">
              Register
            </A>
          </p>
          <p class="text-text-muted mt-2">
            <A href="/forgot-password" class="text-primary hover:underline">
              Forgot your password?
            </A>
          </p>
        </div>
      </div>
    </div>
  );
} 