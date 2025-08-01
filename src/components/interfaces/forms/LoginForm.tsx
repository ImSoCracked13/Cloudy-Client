import { createSignal, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import Button from '../../widgets/Button';
import Input from '../../widgets/Input';
import GoogleButton from '../../blocks/auth/GoogleButton';
import LoginButton from '../../blocks/auth/LoginButton';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm(props: LoginFormProps) {
  const [identifier, setIdentifier] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);
  const [localError, setLocalError] = createSignal<string | null>(null);

  // Clear any local error on input change
  createEffect(() => {
    // Clear local error when inputs change
    if (identifier() || password()) {
      setLocalError(null);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLocalError(null);
  };

  const handleGoogleError = (error: string) => {
    setLocalError(error);
  };

  const handleLoginError = (error: string) => {
    setLocalError(error);
  };

  return (
    <div class="w-full max-w-md mx-auto">
      <div class="bg-[#313338] rounded-md p-8">
        <div class="space-y-6">
          <div class="text-center">
            <h1 class="text-2xl font-semibold text-[#f2f3f5] mb-2">Welcome back</h1>
            <p class="text-[#b5bac1]">Sign in to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-[#b5bac1] uppercase mb-2">Username or Email</label>
              <Input
                type="text"
                value={identifier()}
                onInput={(e) => {
                  // Convert to lowercase for case-insensitive username/email matching
                  setIdentifier(e.currentTarget.value.toLowerCase());
                  setLocalError(null);
                }}
                placeholder="Enter your username or email"
                class="w-full bg-[#1e1f22] border-none rounded-[3px] px-3 py-2.5 text-[#f2f3f5] placeholder-[#949ba4] text-sm"
              />
            </div>
            
            <div>
              <label class="block text-xs font-medium text-[#b5bac1] uppercase mb-2">Password</label>
              <Input
                type={showPassword() ? 'text' : 'password'}
                value={password()}
                onInput={(e) => {
                  setPassword(e.currentTarget.value);
                  setLocalError(null);
                }}
                placeholder="Enter your password"
                class="w-full bg-[#1e1f22] border-none rounded-[3px] px-3 py-2.5 text-[#f2f3f5] placeholder-[#949ba4] text-sm"
                rightIcon={
                  <Button
                    variant="text"
                    aria-label={showPassword() ? 'Hide password' : 'Show password'}
                    class="text-[#b5bac1] hover:text-[#f2f3f5] text-sm"
                    onClick={() => setShowPassword(!showPassword())}
                  >
                    {showPassword() ? 'Hide' : 'Show'}
                  </Button>
                }
              />
            </div>
            
            {localError() && (
              <p class="text-[#f23f42] text-sm">{localError()}</p>
            )}
            
            <LoginButton
              identifier={identifier()}
              password={password()}
              onSuccess={props.onSuccess}
              onError={handleLoginError}
              class="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2.5 px-4 rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
          </form>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-[#2b2d31]"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-[#313338] text-[#949ba4]">Or authenticate with</span>
            </div>
          </div>
          
          <div class="flex justify-center">
            <GoogleButton onSuccess={props.onSuccess} onError={handleGoogleError} fullWidth={true} />
          </div>
          
          <div class="text-center text-sm">
            <span class="text-[#949ba4]">Don't have an account? </span>
            <A href="/register" class="text-[#00a8fc] hover:underline">Register</A>
          </div>
        </div>
      </div>
    </div>
  );
}