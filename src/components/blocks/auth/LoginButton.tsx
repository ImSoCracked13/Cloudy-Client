import { useLogin } from '../../hooks/auth/useLogin';
import Button from '../../widgets/Button';
import toastService from '../../common/Notification';

interface LoginButtonProps {
    identifier: string;
    password: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    class?: string;
}

export default function LoginButton(props: LoginButtonProps) {
    const { login, loading } = useLogin();

    const handleLogin = async () => {
        if (!props.identifier || !props.password) {
            toastService.error('Please enter both username/email and password');
            return;
        }

        try {
        const user = await login(props.identifier, props.password);
        
        // Check if account exists
        if (!user) {
            toastService.error('Account does not exist. Please register first.');
            return; 
        }
        toastService.success('Login successful');
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