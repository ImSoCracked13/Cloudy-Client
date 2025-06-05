import { createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Button from '../components/widgets/Button';
import { authGateway } from '../components/gateway/authGateway';
import { notificationService } from '../components/common/Notification';
import { emailService } from '../components/services/emailService';

export default function VerificationPending() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [isResending, setIsResending] = createSignal(false);
  const [resendMessage, setResendMessage] = createSignal('');
  
  onMount(async () => {
    // Get the email from localStorage that was saved during registration
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    const pendingUsername = localStorage.getItem('pendingVerificationUsername');
    
    if (pendingEmail) {
      setEmail(pendingEmail);
      if (pendingUsername) {
        setUsername(pendingUsername);
      } else {
        // Use email as username if not available
        setUsername(pendingEmail.split('@')[0]);
      }
      
      // Try to send the initial verification email using EmailJS
      await sendVerificationEmail(false);
    } else {
      // If no email is found, redirect to login
      navigate('/login');
    }
  });
  
  const sendVerificationEmail = async (showNotification = true) => {
    if (!email()) return false;
    
    try {
      // Send the email using our EmailJS service
      const success = await emailService.sendVerificationEmailWithToken(
        email(),
        username() || email().split('@')[0]
      );
      
      if (success && showNotification) {
        notificationService.success('Verification email has been sent');
        setResendMessage('Verification email has been sent. Please check your inbox.');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      if (showNotification) {
        setResendMessage('Failed to send verification email. Please try again.');
      }
      return false;
    }
  };
  
  const handleResendEmail = async () => {
    if (!email()) return;
    
    setIsResending(true);
    setResendMessage('');
    
    try {
      // First try with EmailJS
      const emailJsSent = await sendVerificationEmail(true);
      
      // If EmailJS fails, fall back to the server's email method
      if (!emailJsSent) {
        const result = await authGateway.resendVerificationEmail(email());
        
        if (result) {
          notificationService.success('Verification email has been resent');
          setResendMessage('Verification email has been resent. Please check your inbox.');
        } else {
          setResendMessage('Failed to resend verification email. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-background-darker rounded-lg shadow-lg p-8 text-center">
          <div class="flex justify-center mb-6">
            <svg class="h-24 w-24 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <h1 class="text-3xl font-bold text-text mb-4">Verification Email Sent</h1>
          
          <p class="text-text-muted mb-6">
            We've sent a verification email to <span class="font-semibold text-text">{email() || 'your email address'}</span>. 
            Please check your inbox and click the verification link to complete your registration.
          </p>
          
          <div class="mb-6">
            <p class="text-sm text-text-muted mb-2">
              Didn't receive the email? Check your spam folder or click below to resend.
            </p>
            
            <Button 
              variant="secondary" 
              onClick={handleResendEmail} 
              disabled={isResending()}
            >
              {isResending() ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            {resendMessage() && (
              <p class="mt-2 text-sm text-primary">
                {resendMessage()}
              </p>
            )}
          </div>
          
          <div class="border-t border-background pt-6">
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 