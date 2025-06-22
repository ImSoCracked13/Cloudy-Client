import { createSignal, createEffect } from 'solid-js';
import GoogleButton from './GoogleButton';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (usernameOrEmail: string, password: string, username?: string) => Promise<void>;
  isLoading: boolean;
}

export default function AuthForm(props: AuthFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [passwordError, setPasswordError] = createSignal('');
  
  // Add password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check (min 8 chars)
    if (password.length >= 8) strength += 1;
    
    // Contains number
    if (/\d/.test(password)) strength += 1;
    
    // Contains letter
    if (/[a-zA-Z]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return strength;
  };
  
  const getPasswordStrengthText = (strength: number) => {
    if (strength === 0) return 'Very weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };
  
  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-danger';
    if (strength === 2) return 'bg-warning';
    if (strength === 3) return 'bg-success';
    return 'bg-success';
  };

  createEffect(() => {
    // Reset error when password changes
    if (password()) {
      setPasswordError('');
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log(`Form submission - Type: ${props.type}`);
    
    // Validate form
    if (props.type === 'register') {
      if (password() !== confirmPassword()) {
        setPasswordError('Passwords do not match');
        return;
      }
      
      if (password().length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
      
      // Add validation for at least one letter and one number
      if (!/\d/.test(password())) {
        setPasswordError('Password must contain at least one number');
        return;
      }
      
      if (!/[a-zA-Z]/.test(password())) {
        setPasswordError('Password must contain at least one letter');
        return;
      }
      
      console.log('Register form validated, submitting with:', {
        email: usernameOrEmail(),
        username: username(),
        passwordLength: password().length
      });
      
      // For registration, pass email, password, and username
      props.onSubmit(usernameOrEmail(), password(), username());
    } else {
      console.log('Login form validated, submitting with:', {
        usernameOrEmail: usernameOrEmail(),
        passwordLength: password().length
      });
      
      // For login, just pass username/email and password
      props.onSubmit(usernameOrEmail(), password());
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {props.type === 'register' && (
        <div>
          <label for="username" class="block text-sm font-medium text-text-muted mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            class="w-full px-3 py-2 bg-background-darkest border border-background-light rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter your username"
          />
        </div>
      )}

      <div>
        <label for="usernameOrEmail" class="block text-sm font-medium text-text-muted mb-1">
          {props.type === 'login' ? 'Username or Email' : 'Email'}
        </label>
        <input
          id={props.type === 'login' ? 'usernameOrEmail' : 'email'}
          name={props.type === 'login' ? 'usernameOrEmail' : 'email'}
          type={props.type === 'register' ? 'email' : 'text'}
          required
          value={usernameOrEmail()}
          onInput={(e) => setUsernameOrEmail(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background-darkest border border-background-light rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={props.type === 'login' ? 'Enter your username or email' : 'Enter your email'}
          autocomplete={props.type === 'login' ? 'username' : 'email'}
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-text-muted mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background-darkest border border-background-light rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter your password"
        />
        {props.type === 'register' && (
          <>
            <div class="mt-1 mb-1">
              <div class="w-full h-1 bg-background-light flex rounded-full overflow-hidden">
                <div 
                  class={`h-1 ${getPasswordStrengthColor(getPasswordStrength(password()))}`}
                  style={{ width: `${getPasswordStrength(password()) * 25}%` }}
                />
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-text-muted">Strength: {getPasswordStrengthText(getPasswordStrength(password()))}</span>
                {getPasswordStrength(password()) >= 3 && (
                  <span class="text-xs text-success">✓ Meets requirements</span>
                )}
              </div>
            </div>
            <p class="text-xs text-text-muted">
              Password must be at least 8 characters long and contain at least one letter and one number.
            </p>
          </>
        )}
      </div>

      {props.type === 'register' && (
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-text-muted mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword()}
            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
            class="w-full px-3 py-2 bg-background-darkest border border-background-light rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Confirm your password"
          />
          {passwordError() && (
            <p class="mt-1 text-sm text-danger">{passwordError()}</p>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={props.isLoading}
          class="w-full bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-md font-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {props.isLoading
            ? 'Loading...'
            : props.type === 'login'
            ? 'Sign In'
            : 'Create Account'}
        </button>
      </div>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-background-light"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-background-darker text-text-muted">Or continue with</span>
          </div>
        </div>
        
        <div class="mt-6">
          <GoogleButton fullWidth />
        </div>
      </div>
    </form>
  );
} 