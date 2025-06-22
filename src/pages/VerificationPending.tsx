import { createSignal, onMount, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Button from '../components/widgets/Button';
import { authGateway } from '../components/gateway/authGateway';
import { notificationService } from '../components/common/Notification';
import { emailService } from '../components/services/emailService';
import { isEmailJSReady } from '../App';
import { useTheme } from '../components/context/ThemeContext';

export default function VerificationPending() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [isResending, setIsResending] = createSignal(false);
  const [resendMessage, setResendMessage] = createSignal('');
  const [emailAlreadySent, setEmailAlreadySent] = createSignal(false);
  const [initialEmailSent, setInitialEmailSent] = createSignal(false);
  const themeContext = useTheme();
  const isNeonTheme = () => themeContext?.theme() === 'neon';
  
  // Attempt to send the email when EmailJS is ready, but only once
  createEffect(async () => {
    if (isEmailJSReady() && email() && !initialEmailSent()) {
      console.log('EmailJS is now initialized, checking if verification email needed...');
      
      // Check if an email was recently sent
      const sentTimestamp = localStorage.getItem(`verification_email_sent_${email()}`);
      if (sentTimestamp) {
        const timeSinceLastSent = Date.now() - parseInt(sentTimestamp);
        // If we sent an email in the last 5 minutes, don't send another one
        if (timeSinceLastSent < 5 * 60 * 1000) {
          console.log('Email already sent recently, skipping automatic send');
          setEmailAlreadySent(true);
          setInitialEmailSent(true);
          setResendMessage('A verification email was recently sent. Please check your inbox and spam folders.');
          return;
        }
      }
      
      // Mark that we've attempted the initial email to prevent duplicate attempts
      setInitialEmailSent(true);
      
      // Only send if not already sent during registration
      const registrationEmailSent = localStorage.getItem(`registration_email_sent_${email()}`);
      if (registrationEmailSent) {
        console.log('Email was already sent during registration, skipping duplicate send');
        setEmailAlreadySent(true);
        setResendMessage('A verification email was already sent during registration. Please check your inbox and spam folders.');
        return;
      }
      
      const emailSent = await sendVerificationEmail(false);
      
      // If regular flow fails, try direct method
      if (!emailSent) {
        console.log('Regular flow failed in createEffect, trying direct verification email');
        const directSent = await sendDirectVerificationEmail();
        
        if (directSent) {
          console.log('Direct verification email sent successfully via createEffect');
          setEmailAlreadySent(true);
        } else {
          console.warn('Both verification methods failed in createEffect');
        }
      } else {
        setEmailAlreadySent(true);
      }
    }
  });
  
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
      
      // Check localStorage to see if we've already sent an email to this address
      const sentTimestamp = localStorage.getItem(`verification_email_sent_${pendingEmail}`);
      if (sentTimestamp) {
        const timeSinceLastSent = Date.now() - parseInt(sentTimestamp);
        // If we sent an email in the last 5 minutes, don't send another one
        if (timeSinceLastSent < 5 * 60 * 1000) {
          console.log('Email already sent recently, skipping automatic send');
          setEmailAlreadySent(true);
          setInitialEmailSent(true);
          setResendMessage('A verification email was recently sent. Please check your inbox and spam folders.');
          return;
        }
      }
      
      // Check if email was sent during registration
      const registrationEmailSent = localStorage.getItem(`registration_email_sent_${pendingEmail}`);
      if (registrationEmailSent) {
        console.log('Email was already sent during registration, skipping duplicate send');
        setEmailAlreadySent(true);
        setInitialEmailSent(true);
        setResendMessage('A verification email was already sent during registration. Please check your inbox and spam folders.');
      }
    } else {
      // If no email is found, redirect to login
      navigate('/login');
    }
    
    // The createEffect will handle the email sending once everything is ready
  });
  
  const sendVerificationEmail = async (showNotification = true) => {
    if (!email()) return false;
    
    try {
      console.log('Attempting to send verification email to:', email());
      
      // Send the email using our EmailJS service - ensure we use name instead of username
      const success = await emailService.sendVerificationEmailWithToken(
        email(),
        username() || email().split('@')[0]
      );
      
      if (success) {
        if (showNotification) {
          notificationService.success('Verification email has been sent');
          setResendMessage('Verification email has been sent. Please check your inbox.');
        }
        // Record that we sent an email
        localStorage.setItem(`verification_email_sent_${email()}`, Date.now().toString());
        setEmailAlreadySent(true);
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
  
  const sendDirectVerificationEmail = async () => {
    if (!email()) return false;
    
    try {
      setIsResending(true);
      console.log('Sending direct verification email to:', email());
      
      // Sanitize email
      const sanitizedEmail = email().trim();
      if (!sanitizedEmail.includes('@')) {
        console.error('Invalid email format:', sanitizedEmail);
        setResendMessage('Invalid email format. Please use a valid email address.');
        return false;
      }
      
      // Create a verification token manually
      const manualToken = btoa(`${sanitizedEmail}-${Date.now()}`).replace(/=/g, '');
      console.log('Created manual verification token:', manualToken);
      
      // Generate verification link
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';
      const verificationLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(manualToken)}&email=${encodeURIComponent(sanitizedEmail)}`;
      
      console.log('Direct verification link:', verificationLink);
      
      // Send email directly with EmailJS
      try {
        // Ensure we use the correct parameter order and names matching the EmailJS template
        const userName = username() || sanitizedEmail.split('@')[0];
        await emailService.sendVerificationEmail(
          sanitizedEmail,
          userName,
          verificationLink
        );
        
        notificationService.success('Verification email has been sent directly');
        setResendMessage('Verification email has been sent. Please check your inbox.');
        // Record that we sent an email
        localStorage.setItem(`verification_email_sent_${email()}`, Date.now().toString());
        setEmailAlreadySent(true);
        
        return true;
      } catch (emailError) {
        console.error('Error sending direct verification email:', emailError);
        setResendMessage('Failed to send verification email. Please try again or contact support.');
        return false;
      }
    } catch (error) {
      console.error('Direct verification email error:', error);
      setResendMessage('Failed to create verification email. Please try again.');
      return false;
    } finally {
      setIsResending(false);
    }
  };
  
  const handleResendEmail = async () => {
    if (!email()) return;
    
    // Don't allow sending if an email was sent within the last minute
    const sentTimestamp = localStorage.getItem(`verification_email_sent_${email()}`);
    if (sentTimestamp) {
      const timeSinceLastSent = Date.now() - parseInt(sentTimestamp);
      if (timeSinceLastSent < 60 * 1000) { // 1 minute cooldown
        notificationService.warning('Please wait at least 1 minute before requesting another email');
        setResendMessage('Please wait a moment before requesting another email.');
        return;
      }
    }
    
    setIsResending(true);
    setResendMessage('');
    // Reset the sent flag when user explicitly requests a resend
    setEmailAlreadySent(false);
    
    try {
      // Try the server's email method first as it's more reliable
      console.log('Trying server email endpoint');
      const result = await authGateway.resendVerificationEmail(email());
      
      if (result) {
        notificationService.success('Verification email sent successfully');
        setResendMessage('Verification email has been sent. Please check your inbox.');
        localStorage.setItem(`verification_email_sent_${email()}`, Date.now().toString());
        setIsResending(false);
        return;
      }
      
      // Fallback to client-side email sending
      console.log('Server endpoint failed, trying client-side email');
      const clientSideResult = await sendVerificationEmail(true);
      
      if (!clientSideResult) {
        // Last resort - try direct method
        console.log('Client-side method failed, trying direct method');
        await sendDirectVerificationEmail();
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResendMessage('Failed to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div class={`min-h-screen flex items-center justify-center p-4 ${isNeonTheme() ? 'neon-theme' : ''}`}>
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
              onClick={handleResendEmail}
              disabled={isResending()}
              variant="primary"
              class="w-full"
            >
              {isResending() ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            
            {resendMessage() && (
              <p class="mt-2 text-sm text-text-muted">
                {resendMessage()}
              </p>
            )}
          </div>
          
          <div class="border-t border-border pt-6">
            <p class="text-sm text-text-muted mb-4">
              Already verified your email?
            </p>
            
            <Button
              onClick={() => navigate('/login')}
              variant="secondary"
              class="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 