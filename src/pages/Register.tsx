import { createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../components/context/AuthContext';
import { notificationService } from '../components/common/Notification';

export default function Register() {
  const { register, state } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = createSignal('');

  const handleSubmit = async (email: string, password: string, username?: string) => {
    setError('');
    console.log('Register form submitted:', { email, username, passwordLength: password?.length });
    
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      
      console.log('Calling register function with:', { username, email });
      const result = await register(username, email, password);
      console.log('Register result:', result);
      
      if (result.user) {
        notificationService.success('Registration successful!');
        
        // For local auth provider, always check verification status
        const needsVerification = 
          result.verificationRequired || 
          (result.user.authProvider === 'local' && !result.user.isVerified);
        
        console.log('Verification check:', { 
          resultVerificationRequired: result.verificationRequired,
          userAuthProvider: result.user.authProvider,
          userIsVerified: result.user.isVerified,
          needsVerification
        });
        
        if (needsVerification) {
          // Store email and username in localStorage for the verification pending page
          localStorage.setItem('pendingVerificationEmail', email);
          localStorage.setItem('pendingVerificationUsername', username);
          // Redirect to verification pending page
          navigate('/verification-pending');
        } else {
          navigate('/drive');
        }
      } else {
        // If no user returned but no error thrown, show generic message
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full space-y-8 bg-background-darker p-6 rounded-lg shadow-lg">
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-2">Create an account</h1>
          <p class="text-text-muted">Join Cloudy today</p>
        </div>
        
        {error() && (
          <div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded">
            {error()}
          </div>
        )}
        
        <AuthForm 
          type="register"
          onSubmit={handleSubmit}
          isLoading={state.isLoading}
        />
        
        <div class="text-center mt-6">
          <p class="text-text-muted">
            Already have an account?{' '}
            <A href="/login" class="text-primary hover:underline">
              Sign In
            </A>
          </p>
        </div>
      </div>
    </div>
  );
} 