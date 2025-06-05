import { JSX, splitProps, Show, createSignal } from 'solid-js';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  fullWidth?: boolean;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export default function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'label',
    'error',
    'size',
    'class',
    'leftIcon',
    'rightIcon',
    'fullWidth',
    'helperText',
    'showPasswordToggle',
    'type'
  ]);

  const [showPassword, setShowPassword] = createSignal(false);
  const size = local.size || 'md';
  const hasError = !!local.error;
  const inputType = local.showPasswordToggle 
    ? (showPassword() ? 'text' : 'password')
    : local.type || 'text';
  
  const inputSizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
  };
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const paddingWithIconClasses = {
    left: {
      sm: 'pl-8',
      md: 'pl-10',
      lg: 'pl-12',
    },
    right: {
      sm: 'pr-8',
      md: 'pr-10',
      lg: 'pr-12',
    },
  };
  
  const getInputClasses = () => {
    const iconLeftClasses = local.leftIcon ? paddingWithIconClasses.left[size] : '';
    const iconRightClasses = (local.rightIcon || local.showPasswordToggle) ? paddingWithIconClasses.right[size] : '';
    
    return [
      inputSizeClasses[size],
      iconLeftClasses,
      iconRightClasses,
      hasError ? 'border-danger focus:border-danger focus:ring-danger/50' : '',
      local.class || '',
    ].join(' ');
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword());
  };
  
  return (
    <div class={`${local.fullWidth ? 'w-full' : ''}`}>
      {local.label && (
        <label class="block text-sm font-medium text-text mb-1.5">
          {local.label}
        </label>
      )}
      
      <div class={`relative ${local.fullWidth ? 'w-full' : 'inline-block'}`}>
        {local.leftIcon && (
          <div class={`absolute top-0 flex items-center justify-center text-text-muted left-0 pl-3 ${inputSizeClasses[size].split(' ')[0]}`} aria-hidden="true">
            <div class={iconSizeClasses[size]}>
              {local.leftIcon}
            </div>
          </div>
        )}
        
        <input
          {...rest}
          type={inputType}
          class={getInputClasses()}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${rest.id}-error` : local.helperText ? `${rest.id}-helper` : undefined}
        />
        
        {local.rightIcon && !local.showPasswordToggle && (
          <div class={`absolute top-0 flex items-center justify-center text-text-muted right-0 pr-3 ${inputSizeClasses[size].split(' ')[0]}`} aria-hidden="true">
            <div class={iconSizeClasses[size]}>
              {local.rightIcon}
            </div>
          </div>
        )}
        
        {local.showPasswordToggle && (
          <div class={`absolute top-0 flex items-center justify-center text-text-muted right-0 pr-3 ${inputSizeClasses[size].split(' ')[0]}`}>
            <button
              type="button"
              onClick={togglePasswordVisibility}
              class="text-text-muted hover:text-text focus:outline-none"
              aria-label={showPassword() ? "Hide password" : "Show password"}
            >
              <Show
                when={showPassword()}
                fallback={
                  <svg class={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              >
                <svg class={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </Show>
            </button>
          </div>
        )}
      </div>
      
      <Show when={hasError}>
        <p id={`${rest.id}-error`} class="mt-1.5 text-xs text-danger">
          {local.error}
        </p>
      </Show>
      
      <Show when={!hasError && local.helperText}>
        <p id={`${rest.id}-helper`} class="mt-1.5 text-xs text-text-muted">
          {local.helperText}
        </p>
      </Show>
    </div>
  );
} 