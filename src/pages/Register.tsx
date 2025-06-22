import { createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../components/context/AuthContext';
import { notificationService } from '../components/common/Notification';
import { authGateway } from '../components/gateway/authGateway';
import { emailService } from '../components/services/emailService';

export default function Register() {
  const { register, state } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (email: string, password: string, username?: string) => {
    setError('');
    setIsSubmitting(true);
    console.log('Register form validated, submitting with:', { email, username, passwordLength: password?.length });
    
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      
      // Check if account already exists before attempting registration
      try {
        console.log('Checking if account already exists for:', email);
        const accountExists = await authGateway.checkAccountExists(email);
        
        if (accountExists) {
          console.log('ACCOUNT ALREADY EXISTS: Preventing registration and verification email', { email });
          throw new Error('An account with this email already exists. Please use a different email or login instead.');
        }
      } catch (checkError) {
        // If the error specifically mentions "already exists", throw it immediately
        if (checkError instanceof Error && checkError.message.includes('already exists')) {
          throw checkError;
        }
        // Otherwise continue with registration attempt (the check might have failed for other reasons)
        console.warn('Account existence check failed, continuing with registration:', checkError);
      }
      
      console.log('Register form submitted:', { email, username });
      const result = await register(username, email, password);
      console.log('Register result:', result);
      
      // Clear any previous verification data
      localStorage.removeItem(`verification_email_sent_${email}`);
      
      // Store email and username in localStorage for the verification pending page
      localStorage.setItem('pendingVerificationEmail', email);
      localStorage.setItem('pendingVerificationUsername', username);
      
      // Attempt to send verification email directly as a fallback
      try {
        console.log('Attempting to send verification email directly');
        const emailSent = await emailService.sendVerificationEmailWithToken(email, username);
        
        if (emailSent) {
          // Mark that we sent a verification email during registration
          localStorage.setItem(`verification_email_sent_${email}`, Date.now().toString());
          localStorage.setItem(`registration_email_sent_${email}`, 'true');
          console.log('Verification email sent during registration');
        }
      } catch (emailError) {
        console.error('Failed to send verification email directly:', emailError);
        // Continue with the flow even if email sending fails
      }
      
      // Always show success message and redirect
      notificationService.success('Registration successful! Please verify your email.');
      
      // Force a small delay to ensure notifications are visible before redirect
      setTimeout(() => {
        navigate('/verification-pending');
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Check for specific error types
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      if (errorMessage.includes('already exists')) {
        console.log('ACCOUNT ALREADY EXISTS: Preventing verification email sending', { email });
        setError('An account with this email already exists. Please use a different email or login instead.');
        // Do not navigate to verification page - stay on registration page
      } else if (errorMessage.includes('Password must be at least 8 characters')) {
        setError('Password must be at least 8 characters long.');
      } else if (errorMessage.includes('one letter and one number')) {
        setError('Password must contain at least one letter and one number.');
      } else {
        setError(errorMessage);
      }
      
      // Show notification for validation errors
      notificationService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
          isLoading={isSubmitting() || state.isLoading}
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