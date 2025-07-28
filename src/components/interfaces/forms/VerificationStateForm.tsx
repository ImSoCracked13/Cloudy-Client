import { createSignal, Show } from 'solid-js';
import Button from '../../widgets/Button';
import VerifyEmailButton from '../../blocks/auth/VerifyEmailButton';

interface VerifyStateFormProps {
  token?: string;
  email?: string;
  onVerificationStart?: () => void;
  onVerificationSuccess?: (email?: string) => void;
  onVerificationError?: (error: string) => void;
  onNavigateToLogin?: () => void;
  onNavigateToVerificationPending?: () => void;
}

export default function VerifyStateForm(props: VerifyStateFormProps) {
  const [verifying, setVerifying] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleVerificationSuccess = (verifiedEmail?: string) => {
    setSuccess(true);
    setError(null);
    setVerifying(false);
    
    // If verification was successful and we have the email, store it for login
    if (verifiedEmail || props.email) {
      sessionStorage.setItem('verified_email', verifiedEmail || props.email!);
    }
    
    // Clear any pending verification data
    localStorage.removeItem('pending_verification_email');
    localStorage.removeItem('pending_verification_username');
    
    props.onVerificationSuccess?.(verifiedEmail || props.email);
  };

  const handleVerificationError = (errorMsg: string) => {
    setError(errorMsg);
    setSuccess(false);
    setVerifying(false);
    props.onVerificationError?.(errorMsg);
  };

  const handleVerificationStart = () => {
    setVerifying(true);
    setError(null);
    props.onVerificationStart?.();
  };

  return (
    <div class="space-y-6 text-center">
      <h2 class="text-2xl font-semibold text-white">Email Verification</h2>
      
      <Show when={!verifying() && !success() && !error()}>
        <div class="space-y-4">
          <p class="text-gray-400">
            Click the button below to verify your email address. This will help us ensure your account and allow you to access all features.
          </p>
          <VerifyEmailButton
            token={props.token}
            email={props.email}
            onStart={handleVerificationStart}
            onSuccess={handleVerificationSuccess}
            onError={handleVerificationError}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          />
        </div>
      </Show>

      <Show when={verifying()}>
        <div class="space-y-4">
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p class="text-gray-400">Verifying your email address...</p>
        </div>
      </Show>

      <Show when={!verifying() && success()}>
        <div class="space-y-6">
          <div class="flex justify-center">
            <div class="rounded-full bg-green-100 p-3">
              <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-medium text-white">Verification Successful!</h3>
            <p class="text-gray-400">
              Your email has been verified successfully. You can now sign in to your account.
            </p>
          </div>
          <Button
            onClick={props.onNavigateToLogin}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Sign In
          </Button>
        </div>
      </Show>

      <Show when={!verifying() && error()}>
        <div class="space-y-6">
          <div class="flex justify-center">
            <div class="rounded-full bg-red-100 p-3">
              <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-xl font-medium text-white">Verification Failed</h3>
            <p class="text-red-400">{error()}</p>
          </div>
          <Button
            onClick={props.onNavigateToVerificationPending}
            class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Resend Verification Email
          </Button>
        </div>
      </Show>
    </div>
  );
}