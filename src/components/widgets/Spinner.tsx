import { JSX } from 'solid-js';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'text';
  label?: string;
  class?: string;
}

export default function Spinner(props: SpinnerProps) {
  const size = props.size || 'md';
  const color = props.color || 'primary';
  
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-8 w-8';
    }
  };
  
  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'text-primary';
      case 'white': return 'text-white';
      case 'text': return 'text-text';
      default: return 'text-primary';
    }
  };
  
  return (
    <div class={`flex flex-col items-center justify-center ${props.class || ''}`}>
      <div class={`spinner ${getSizeClass()} ${getColorClass()}`} aria-hidden="true"></div>
      {props.label && (
        <p class="mt-2 text-sm text-text-muted">{props.label}</p>
      )}
    </div>
  );
} 