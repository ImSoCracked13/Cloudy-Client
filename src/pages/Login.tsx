import { createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../components/context/AuthContext';
import { notificationService } from '../components/common/Notification';

export default function Login() {
  const { login, state } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = createSignal('');

  const handleSubmit = async (usernameOrEmail: string, password: string) => {
    setError('');
    console.log('Login form submitted:', { usernameOrEmail, passwordLength: password?.length });
    
    try {
      console.log('Calling login function');
      const user = await login(usernameOrEmail, password);
      console.log('Login result:', user);
      
      if (user) {
        notificationService.success('Login successful!');
        navigate('/drive');
      } else {
        // If no user returned but no error thrown, show generic message
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full space-y-8 bg-background-darker p-6 rounded-lg shadow-lg">
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-2">Welcome back</h1>
          <p class="text-text-muted">Sign in to your account</p>
        </div>
        
        {error() && (
          <div class="bg-danger/20 border border-danger/30 text-danger px-4 py-3 rounded">
            {error()}
          </div>
        )}
        
        <AuthForm 
          type="login"
          onSubmit={handleSubmit}
          isLoading={state.isLoading}
        />
        
        <div class="text-center mt-6">
          <p class="text-text-muted">
            Don't have an account?{' '}
            <A href="/register" class="text-primary hover:underline">
              Register
            </A>
          </p>
          <p class="text-text-muted mt-2">
            <A href="/forgot-password" class="text-primary hover:underline">
              Forgot your password?
            </A>
          </p>
        </div>
      </div>
    </div>
  );
} 