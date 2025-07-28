import { Component, JSX } from 'solid-js';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  children: JSX.Element;
  class?: string;
  title?: string;
  autofocus?: boolean;
  loading?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
}

const Button: Component<ButtonProps> = (props) => {
  // Use CSS variables for colors
  const variantClass = {
    primary: '!bg-blue-600 hover:!bg-blue-700 text-white',
    secondary: '!bg-gray-600 hover:!bg-gray-700 text-white',
    danger: '!bg-red-600 hover:!bg-red-700 text-white',
    success: '!bg-green-600 hover:!bg-green-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
    text: 'bg-transparent text-blue-600 hover:text-blue-700'
  }[props.variant || 'primary'];
  
  const sizeClass = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-4',
    lg: 'text-lg py-3 px-6'
  }[props.size || 'md'];

  return (
    <button
      type={props.type || 'button'}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
      title={props.title}
      autofocus={props.autofocus}
      class={`
        ${props.class || ''}
        ${variantClass}
        ${sizeClass}
        ${props.fullWidth ? 'w-full' : ''}
        font-medium rounded-md transition-all duration-200
        focus:outline-none focus:!ring-2 focus:!ring-blue-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${props.loading ? 'relative !cursor-wait' : ''}
      `}
    >
      {props.loading && (
        <span class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span class={props.loading ? 'invisible' : 'flex items-center'}>
        {props.leftIcon && <span class="mr-2">{props.leftIcon}</span>}
        {props.children}
        {props.rightIcon && <span class="ml-2">{props.rightIcon}</span>}
      </span>
    </button>
  );
};

export default Button; 