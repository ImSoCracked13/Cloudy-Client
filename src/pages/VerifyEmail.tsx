import { createSignal, onMount } from 'solid-js';
import { useSearchParams, useNavigate } from '@solidjs/router';
import { authGateway } from '../components/gateway/authGateway';
import Button from '../components/widgets/Button';
import Spinner from '../components/widgets/Spinner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [isVerifying, setIsVerifying] = createSignal(true);
  const [isSuccess, setIsSuccess] = createSignal(false);
  const [error, setError] = createSignal('');
  
  onMount(async () => {
    const token = searchParams.token as string;
    
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setIsVerifying(false);
      return;
    }
    
    try {
      console.log('Verifying email with token:', token);
      const result = await authGateway.verifyEmail(token);
      setIsSuccess(result);
      
      if (result) {
        console.log('Email verification successful, redirecting to success page');
        // Redirect to success page on successful verification
        navigate('/verify-success');
      } else {
        console.error('Email verification failed');
        setError('Verification failed. The link may have expired or been used already.');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setIsSuccess(false);
    } finally {
      setIsVerifying(false);
    }
  });
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleRequestNewLink = async () => {
    const email = searchParams.email as string;
    
    if (!email) {
      setError('Email information is missing from this link');
      return;
    }
    
    try {
      const result = await authGateway.resendVerificationEmail(email);
      if (result) {
        setError('');
        navigate('/verification-pending');
      } else {
        setError('Failed to send verification email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request new verification link');
    }
  };
  
  return (
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-background-darker p-8 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-center mb-4 text-text">Email Verification</h1>
        
        {isVerifying() ? (
          <div class="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" />
            <p class="mt-4 text-text-muted">Verifying your email...</p>
          </div>
        ) : isSuccess() ? (
          <div class="text-center">
            <div class="flex justify-center mb-6">
              <div class="rounded-full bg-success/20 p-3">
                <svg class="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 class="text-xl font-semibold mb-2 text-text">Email Verified!</h2>
            <p class="text-text-muted mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            
            <Button onClick={handleLogin} fullWidth>
              Go to Login
            </Button>
          </div>
        ) : (
          <div class="text-center">
            <div class="flex justify-center mb-6">
              <div class="rounded-full bg-danger/20 p-3">
                <svg class="h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            
            <h2 class="text-xl font-semibold mb-2 text-text">Verification Failed</h2>
            <p class="text-text-muted mb-6">
              {error() || 'The verification link may have expired or been used already.'}
            </p>
            
            <div class="space-y-3">
              <Button onClick={handleRequestNewLink} fullWidth>
                Request New Verification Link
              </Button>
              
              <Button onClick={handleLogin} variant="secondary" fullWidth>
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 