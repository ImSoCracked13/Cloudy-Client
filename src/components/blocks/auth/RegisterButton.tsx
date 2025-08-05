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
        // Basic validation
        if (!props.username || !props.email || !props.password || !props.confirmPassword) {
            toastService.error('Please fill in all fields');
            return;
        }

        // Email format validation
        const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailPattern.test(props.email)) {
            toastService.error('Please enter a valid email address');
            return;
        }

        // Password validation
        if (props.password.length < 8) {
            toastService.error('Password must be at least 8 characters long');
            return;
        }

        try {
            const result = await register(props.username, props.email, props.password, props.confirmPassword);

            if (!result.success) {
                toastService.error(result.message || 'Registration failed. Account may already exist.');
                return;
            }
            
            toastService.success('Registration successful!');

            // Send verification email if needed
            if (result.verificationRequired) {
                try {
                    await sendVerificationEmail(props.email);
                    toastService.success('Verification email sent! Please check your inbox.');
                } catch (emailError) {
                    toastService.warning('Registration successful, but failed to send verification email.');
                }
            }

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