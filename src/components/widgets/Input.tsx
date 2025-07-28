import { JSX, splitProps } from 'solid-js';

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  label?: string;
  fullWidth?: boolean;
  error?: string;
}

export default function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'leftIcon',
    'rightIcon',
    'label',
    'fullWidth',
    'error'
  ]);

  return (
    <div class="w-full">
      {local.label && (
        <label class="block text-sm font-medium mb-1 text-gray-400">
          {local.label}
        </label>
      )}
      <div class={`relative ${local.fullWidth ? 'w-full' : ''}`}>
        {local.leftIcon && (
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {local.leftIcon}
          </div>
        )}
        <input
          {...rest}
          class={`w-full bg-gray-800/50 border-0 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${local.leftIcon ? 'pl-10' : ''} ${local.class || ''}`}
        />
        
        {local.rightIcon && (
          <div class="absolute inset-y-0 right-0 flex items-center pr-3">
            {local.rightIcon}
          </div>
        )}
      </div>
      {local.error && (
        <p class="mt-1 text-sm text-red-500">{local.error}</p>
      )}
    </div>
  );
}