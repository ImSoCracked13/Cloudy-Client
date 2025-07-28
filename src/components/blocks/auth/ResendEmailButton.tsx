import { useSendEmail } from '../../hooks/auth/useSendEmail';
import Button from '../../widgets/Button';
import toastService from '../../common/Notification';

interface ResendEmailButtonProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  class?: string;
}

export default function ResendEmailButton(props: ResendEmailButtonProps) {
  const { sendVerificationEmail, loading: resendLoading } = useSendEmail();

  const handleResendEmail = async () => {
    if (!props.email) {
        toastService.error('No email address provided');
      return;
    }

    try {
      const result = await sendVerificationEmail(props.email);
      
      if (result) {
        toastService.success('Verification email sent! Please check your inbox.');
        props.onSuccess?.();
      } else {
        toastService.error('Failed to send verification email. Please try again later.');;
      }
    } catch (err) {
        toastService.error('Failed to send verification email. Please try again later.');
    }
  };

  return (
    <Button
      type="button"
      onClick={handleResendEmail}
      class={`flex justify-center items-center text-center ${props.class || ''}`}
      disabled={props.disabled || resendLoading()}
    >
      {resendLoading() ? 'Sending...' : 'Resend Email'}
    </Button>
  );
}