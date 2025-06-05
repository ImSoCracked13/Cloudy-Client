import { JSX, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
}

export default function Button(props: ButtonProps) {
  const [local, buttonProps] = splitProps(props, [
    'variant', 
    'size', 
    'fullWidth', 
    'loading', 
    'leftIcon', 
    'rightIcon', 
    'class', 
    'children'
  ]);
  
  const variant = local.variant || 'primary';
  const size = local.size || 'md';
  
  const getVariantClasses = () => {
    return `btn btn-${variant}`;
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'md': return 'text-sm px-4 py-2';
      case 'lg': return 'text-base px-6 py-3';
      default: return 'text-sm px-4 py-2';
    }
  };
  
  return (
    <button
      {...buttonProps}
      disabled={props.disabled || local.loading}
      class={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${local.fullWidth ? 'w-full' : ''}
        ${local.class || ''}
      `}
    >
      {local.loading && (
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!local.loading && local.leftIcon && <span>{local.leftIcon}</span>}
      {local.children}
      {!local.loading && local.rightIcon && <span>{local.rightIcon}</span>}
    </button>
  );
} 