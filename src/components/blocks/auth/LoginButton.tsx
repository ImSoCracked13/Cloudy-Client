import { useLogin } from '../../hooks/auth/useLogin';
import Button from '../../widgets/Button';
import toastService from '../../common/Notification';

interface LoginButtonProps {
    identifier: string;
    password: string;
    rememberMe: boolean;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    class?: string;
}

export default function LoginButton(props: LoginButtonProps) {
    const { login, loading, setPersistentLogin } = useLogin();

    const handleLogin = async () => {
        if (!props.identifier || !props.password) {
            toastService.error('Please enter both username/email and password');
            return;
        }

        try {
        setPersistentLogin(props.rememberMe);
        const user = await login(props.identifier, props.password);
        
        // Check if account exists
        if (!user) {
            toastService.error('Account does not exist. Please register first.');
            return; 
        }

        toastService.success('Login successful');
        
        // Store the email for future reference (convert to lowercase for consistency)
        localStorage.setItem('last_login_email', props.identifier.toLowerCase());
        
        // Also store in a separate key for local email tracking
        const emailKey = `local_email_${props.identifier.toLowerCase()}`;
        localStorage.setItem(emailKey, props.identifier.toLowerCase());
        
        props.onSuccess?.();
        
        } catch (err) {
            toastService.error('Login failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    return (
        <Button
        type="button"
        onClick={handleLogin}
        class={`flex justify-center items-center text-center ${props.class || ''}`}
        disabled={props.disabled || loading() || !props.identifier || !props.password}
        >
        {loading() ? 'Signing in...' : 'Sign In'}
        </Button>
    );
}