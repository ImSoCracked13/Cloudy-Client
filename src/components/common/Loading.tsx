import { Show } from 'solid-js';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
}

export default function Loading(props: LoadingProps) {
  const getSize = () => {
    switch (props.size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-8 w-8';
      default: return 'h-6 w-6';
    }
  };
  
  const getColor = () => {
    switch (props.color) {
      case 'primary': return 'text-blue-600';
      case 'white': return 'text-white';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div class="flex flex-col items-center">
      <div class={`animate-spin ${getSize()} ${getColor()}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <Show when={props.text}>
        <p class={`mt-2 text-sm ${getColor()}`}>{props.text}</p>
      </Show>
    </div>
  );
} 