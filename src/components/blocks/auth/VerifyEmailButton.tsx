import { useVerifyEmail } from '../../hooks/auth/useVerifyEmail';
import Button from '../../widgets/Button';
import toastService from '../../common/Notification';

interface VerifyEmailButtonProps {
  token?: string;
  email?: string;
  onStart?: () => void;
  onSuccess?: (verifiedEmail?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  class?: string;
}

export default function VerifyEmailButton(props: VerifyEmailButtonProps) {
  const { verifyEmail, loading } = useVerifyEmail();

  const handleVerifyEmail = async () => {
    if (!props.token) {
        const errorMsg = 'No verification token provided';
        toastService.error(errorMsg);
        props.onError?.(errorMsg);
        return;
    }

    props.onStart?.();

    try {
      const result = await verifyEmail(props.token);
      
      if (result) {
        toastService.success('Email verified successfully! You can now log in.');
        props.onSuccess?.(props.email);
      } else {
        const errorMsg = 'Email verification failed. Please try again or request a new verification email.';
        toastService.error(errorMsg);
        props.onError?.(errorMsg);
      }
    } catch (err) {
        const errorMsg = 'Email verification failed. Please try again or request a new verification email.';
        toastService.error(errorMsg);
        props.onError?.(errorMsg);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleVerifyEmail}
      class={`flex justify-center items-center text-center ${props.class || ''}`}
      disabled={props.disabled || loading() || !props.token}
    >
      {loading() ? 'Verifying...' : 'Verify Email'}
    </Button>
  );
}