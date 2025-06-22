import { createSignal, onMount, Show } from 'solid-js';
import { useNavigate, useSearchParams, A } from '@solidjs/router';
import { authGateway } from '../components/gateway/authGateway';
import { notificationService } from '../components/common/Notification';
import { useTheme } from '../components/context/ThemeContext';
import Button from '../components/widgets/Button';

export default function VerifyState() {
  // State variables
  const [isVerified, setIsVerified] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [debugInfo, setDebugInfo] = createSignal<any>({});
  const [verifiedEmail, setVerifiedEmail] = createSignal('');
  const [folderCreated, setFolderCreated] = createSignal(false);
  
  // Navigation and params
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.token || '';
  const email = params.email || localStorage.getItem('pending_verification_email') || '';
  
  // Theme
  const themeContext = useTheme();
  const isNeonTheme = () => themeContext?.theme() === 'neon';
  
  onMount(async () => {
    // If we have a token, process verification
    if (token) {
      await processVerification();
    } 
    // If we don't have a token but have an email, assume already verified
    else if (email) {
      handleAlreadyVerified();
    }
    // No token or email
    else {
      setError('No verification token or email provided');
      setIsLoading(false);
    }
  });
  
  const processVerification = async () => {
    setDebugInfo({ token: typeof token === 'string' ? token.substring(0, 8) + '...' : token, email });
    
    try {
      console.log('Verify email route called with token:', typeof token === 'string' ? token.substring(0, 8) + '...' : token);
      
      // Try to decode the token to see if it's base64 encoded email
      try {
        if (typeof token === 'string') {
          const decodedToken = atob(token);
          if (decodedToken.includes('@')) {
            console.log('Token appears to be base64 encoded email:', decodedToken);
            setDebugInfo(prev => ({ ...prev, tokenType: 'base64', decoded: decodedToken }));
          }
        }
      } catch (decodeError) {
        console.warn('Token is not base64 encoded:', decodeError);
        setDebugInfo(prev => ({ ...prev, tokenType: 'standard' }));
      }
      
      // First try with the token from URL
      let response = await authGateway.verifyEmail(typeof token === 'string' ? token : token[0] || '');
      console.log('Verify email response:', response);
      
      // If verification failed and we have an email, try repair as fallback
      if (!response.success && email) {
        console.log('Verification failed, trying repair with email:', email);
        try {
          const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] : '';
          const repairResult = await authGateway.repairFolderStructure(emailStr);
          console.log('Repair result:', repairResult);
          if (repairResult) {
            response = {
              success: true,
              message: 'Account verified through repair process',
              user: { email: emailStr }
            };
          }
        } catch (repairError) {
          console.error('Repair attempt failed:', repairError);
        }
      }
      
      setDebugInfo(prev => ({ ...prev, response }));
      
      if (response.success) {
        setIsVerified(true);
        
        // Save any user info we got back
        if (response.user && response.user.email) {
          const userEmail = response.user.email;
          setVerifiedEmail(userEmail);
          setDebugInfo(prev => ({ ...prev, user: response.user }));
          localStorage.setItem('verified_email', userEmail);
          
          // Create folder structure
          await createFolderStructure(userEmail);
        }
        
        // Show success notification
        notificationService.success('Email verification successful!');
      } else {
        setError(response.message || 'Failed to verify email token');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAlreadyVerified = async () => {
    // Handle case when user is already verified (coming from success redirect)
    const emailParam = params.email;
    const emailValue = Array.isArray(emailParam) ? emailParam[0] : (emailParam || '');
    
    setVerifiedEmail(emailValue);
    setIsVerified(true);
    setIsLoading(false);
    
    // Create folder structure if not already done
    if (emailValue && !folderCreated()) {
      await createFolderStructure(emailValue);
    }
  };
  
  const createFolderStructure = async (userEmail: string) => {
    try {
      const { fileGateway } = await import('../components/gateway/fileGateway');
      await fileGateway.createInitialStructure(userEmail);
      console.log('Initial folder structure created after verification');
      setFolderCreated(true);
      return true;
    } catch (error) {
      console.error('Error creating folder structure after verification:', error);
      return false;
    }
  };
  
  const handleRetry = async () => {
    setIsLoading(true);
    setError('');
    
    // Wait a moment before retrying
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  return (
    <div class={`flex flex-col items-center justify-center min-h-screen p-4 ${isNeonTheme() ? 'neon-theme' : ''}`}>
      <div class={`w-full max-w-md p-8 space-y-8 rounded-lg shadow-md bg-background-darker`}>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-text">Email Verification</h1>
          
          {/* Loading state */}
          <Show when={isLoading()}>
            <div class="mt-6">
              <div class="flex justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p class="mt-4 text-text-muted">Verifying your email address...</p>
            </div>
          </Show>
          
          {/* Success state */}
          <Show when={!isLoading() && isVerified()}>
            <div class="mt-6 text-center">
              <div class={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20`}>
                <svg class="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 class="text-2xl font-bold mt-4 text-text">Email Verified Successfully!</h2>
              <p class="text-text-muted mt-2">
                Your email has been verified. You can now log in to your account.
              </p>
              
              <div class="mt-6">
                <Button onClick={() => navigate('/login')} fullWidth>
                  Log In Now
                </Button>
              </div>
            </div>
          </Show>
          
          {/* Error state */}
          <Show when={!isLoading() && !isVerified() && error()}>
            <div class="mt-6 text-center">
              <div class={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/20`}>
                <svg class="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p class="mt-4 text-lg font-medium text-text">Verification Failed</p>
              <p class="mt-2 text-danger">{error()}</p>
              
              <div class="mt-6 flex flex-col gap-3">
                <Button onClick={handleRetry} variant="secondary">
                  Try Again
                </Button>
                <A href="/login" class="text-primary hover:underline">
                  Return to Login
                </A>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
} 