import { useRegister } from '../../hooks/auth/useRegister';
import { useSendEmail } from '../../hooks/auth/useSendEmail';
import Button from '../../widgets/Button';
import toastService from '../../common/Notification';

interface RegisterButtonProps {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    class?: string;
}

export default function RegisterButton(props: RegisterButtonProps) {
    const { register, loading: registerLoading } = useRegister();
    const { sendVerificationEmail, loading: resendLoading } = useSendEmail();

    const handleRegister = async () => {

        if (!props.username || !props.email || !props.password || !props.confirmPassword) {
            toastService.error('Please fill in all fields');
            return;
        }

        // Check for valid email format (must contain @ and a domain)
        const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailPattern.test(props.email)) {
            toastService.error('Please enter a valid email address with a provider (e.g., user@example.com)');
            return;
        }

        if (props.password !== props.confirmPassword) {
            toastService.error('Passwords do not match');
            return;
        }

        // Check for password at least 8 characters long
        if (props.password.length < 8) {
            toastService.error('Password must be at least 8 characters long');
            return;
        }

        try {

            const result = await register(props.username, props.email, props.password, props.confirmPassword);

            // Handle registration errors in general, this is the best error handling we can do for checking if both Local and Google auth are registered
            if (!result || result.success === false) {
                toastService.error('Registration failed. Account may already exist. Please try login instead with Google or Local methods.');
                return;
            }
            
            toastService.success('Registration successful! Please check your email for verification instructions.');
        
            // Check for success in different response formats
            const isSuccess = 
                // Check for verificationRequired flag
                (result && result.verificationRequired) || 
                // Check for success flag in response
                (result && result.success === true) ||
                // Check for user object
                (result && result.user);
            
            // Check for verification required message in response
            const needsVerification =
                (result && result.verificationRequired) ||
                (result && result.message && result.message.toLowerCase().includes('verify')) ||
                (result && typeof result.message === 'string' && result.message.toLowerCase().includes('verification'));

            if (isSuccess && needsVerification) {
                // Try to send verification email
                try {
                await sendVerificationEmail(props.email);
                toastService.success('Verification email sent! Please check your inbox.');
                } catch (emailError) {
                toastService.warning('Registration successful, but failed to send verification email. Please try resending from the verification page.');
                }
            }
            
            // Store local email info for cross-checking with Google auth
            const emailKey = `local_email_${props.email.toLowerCase()}`;
            localStorage.setItem(emailKey, props.email.toLowerCase());

            props.onSuccess?.();

        } catch (err) {
            toastService.error('Registration failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const loading = () => registerLoading() || resendLoading();

    return (
        <Button
            type="button"
            onClick={handleRegister}
            class={`flex justify-center items-center text-center ${props.class || ''}`}
            disabled={props.disabled || loading() || !props.username || !props.email || !props.password || !props.confirmPassword}
            >
            {loading() ? 'Creating Account...' : 'Create Account'}
        </Button>
    );
}