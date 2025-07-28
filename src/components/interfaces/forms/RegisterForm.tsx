import { createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Button from '../../widgets/Button';
import Input from '../../widgets/Input';
import GoogleButton from '../../blocks/auth/GoogleButton';
import RegisterButton from '../../blocks/auth/RegisterButton';

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm(props: RegisterFormProps) {
  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);
  const [localError, setLocalError] = createSignal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLocalError(null);
  };

  const handleGoogleError = (error: string) => {
    setLocalError(error);
  };

  const handleRegisterError = (error: string) => {
    setLocalError(error);
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    const pwd = password();
    let strength = 0;
    
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    return strength;
  };

  const getPasswordStrengthText = () => {
    const strength = getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return { text: 'Very Weak', color: '#f56565' };
      case 2: return { text: 'Weak', color: '#ed8936' };
      case 3: return { text: 'Good', color: '#ecc94b' };
      case 4: return { text: 'Strong', color: '#68d391' };
      case 5: return { text: 'Very Strong', color: '#38a169' };
      default: return { text: 'Very Weak', color: '#f56565' };
    }
  };

  return (
    <div class="w-full max-w-md mx-auto">
      <div class="bg-[#313338] rounded-md p-8">
        <div class="space-y-6">
          <div class="text-center">
            <h1 class="text-2xl font-semibold text-[#f2f3f5] mb-2">First Time?</h1>
            <p class="text-[#b5bac1]">Join Cloudy!</p>
          </div>
          
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-[#b5bac1] uppercase mb-2">Username</label>
              <Input
                type="text"
                value={username()}
                onInput={(e) => {
                  setUsername(e.currentTarget.value.toLowerCase());
                  setLocalError(null);
                }}
                placeholder="Choose a username"
                class="w-full bg-[#1e1f22] border-none rounded-[3px] px-3 py-2.5 text-[#f2f3f5] placeholder-[#949ba4] text-sm"
              />
            </div>
            
            <div>
              <label class="block text-xs font-medium text-[#b5bac1] uppercase mb-2">Email</label>
              <Input
                type="email"
                value={email()}
                onInput={(e) => {
                  setEmail(e.currentTarget.value);
                  setLocalError(null);
                }}
                placeholder="Enter your email"
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
                placeholder="Create a password"
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
              
              {password() && (
                <div class="mt-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-[#b5bac1]">Password strength:</span>
                    <span style={{ color: getPasswordStrengthText().color }}>
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                  <div class="w-full bg-[#2b2d31] rounded-full h-1.5 mt-1">
                    <div
                      class="h-1.5 rounded-full transition-all duration-200"
                      style={{
                        width: `${(getPasswordStrength() / 5) * 100}%`,
                        'background-color': getPasswordStrengthText().color
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label class="block text-xs font-medium text-[#b5bac1] uppercase mb-2">Confirm Password</label>
              <Input
                type={showConfirmPassword() ? 'text' : 'password'}
                value={confirmPassword()}
                onInput={(e) => {
                  setConfirmPassword(e.currentTarget.value);
                  setLocalError(null);
                }}
                placeholder="Confirm your password"
                class="w-full bg-[#1e1f22] border-none rounded-[3px] px-3 py-2.5 text-[#f2f3f5] placeholder-[#949ba4] text-sm"
                rightIcon={
                  <Button
                    variant="text" 
                    aria-label={showConfirmPassword() ? 'Hide password' : 'Show password'}
                    class="text-[#b5bac1] hover:text-[#f2f3f5] text-sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword())}
                  >
                    {showConfirmPassword() ? 'Hide' : 'Show'}
                  </Button>
                }
              />
            </div>
            
            {localError() && (
              <p class="text-[#f23f42] text-sm">{localError()}</p>
            )}
            
            <RegisterButton
              username={username()}
              email={email()}
              password={password()}
              confirmPassword={confirmPassword()}
              onSuccess={props.onSuccess}
              onError={handleRegisterError}
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
            <span class="text-[#949ba4]">Already have an account? </span>
            <A href="/login" class="text-[#00a8fc] hover:underline">Log in</A>
          </div>
        </div>
      </div>
    </div>
  );
}