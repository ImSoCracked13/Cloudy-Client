import { createSignal, createEffect } from 'solid-js';
import ResendEmailButton from '../../blocks/auth/ResendEmailButton';

interface VerificationPendingFormProps {
  onNavigateToLogin?: () => void;
  onResendSuccess?: () => void;
  onResendError?: (error: string) => void;
}

export default function VerificationPendingForm(props: VerificationPendingFormProps) {
  const [localError, setLocalError] = createSignal<string | null>(null);
  const [email, setEmail] = createSignal<string>('');

  // Try to get email from localStorage or URL params
  createEffect(() => {
    // First try to get from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Try to get from localStorage
      const storedEmail = localStorage.getItem('pending_verification_email') ||
                          localStorage.getItem('verification_email') || 
                          localStorage.getItem('register_email') ||
                          localStorage.getItem('last_login_email');
      if (storedEmail) {
        // Remove any provider suffix (e.g., ":google")
        const cleanEmail = storedEmail.split(':')[0];
        setEmail(cleanEmail);
      }
    }
  });

  const handleResendSuccess = () => {
    setLocalError(null);
    props.onResendSuccess?.();
  };

  const handleResendError = (error: string) => {
    setLocalError(error);
    props.onResendError?.(error);
  };

  return (
    <div class="w-full max-w-md mx-auto">
      <div class="bg-[#313338] rounded-md p-8">
        <div class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 class="text-2xl font-semibold text-[#f2f3f5] mb-2">Check Your Email</h1>
            <p class="text-[#b5bac1]">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>
            {email() && (
              <p class="text-[#949ba4] text-sm mt-2 break-all">
                Sent to: <span class="text-[#f2f3f5]">{email()}</span>
              </p>
            )}
          </div>

          <div class="space-y-4">
            <div class="text-center">
              <p class="text-[#b5bac1] text-sm mb-4">
                Didn't receive the email? Check your spam folder or request a new one.
              </p>
              
              {localError() && (
                <p class="text-[#f23f42] text-sm mb-4">{localError()}</p>
              )}
              
              <ResendEmailButton
                email={email()}
                onSuccess={handleResendSuccess}
                onError={handleResendError}
                class="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mb-3"
              />
              
              <button
                onClick={props.onNavigateToLogin}
                class="w-full bg-[#b5bac1] hover:bg-[#949ba4] text-[#23272a] font-medium py-2.5 px-4 rounded-[3px] transition-colors text-sm flex justify-center items-center text-center"
              >
                Back to Login
              </button>
            </div>
          </div>

          <div class="text-center text-xs text-[#949ba4]">
            <p>Having trouble? Contact support for assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}