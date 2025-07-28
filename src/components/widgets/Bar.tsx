import { Component, JSX, Show } from 'solid-js';

export interface BarProps {
  progress: number; // 0-100
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  striped?: boolean;
  rounded?: boolean;
  class?: string;
  children?: JSX.Element;
}

const Bar: Component<BarProps> = (props) => {
  // Ensure progress is between 0-100
  const safeProgress = () => Math.max(0, Math.min(100, props.progress));
  
  // Get color class based on props or default to primary
  const colorClass = () => {
    const colors = {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info'
    };
    return colors[props.color || 'primary'];
  };
  
  // Get height class based on size
  const heightClass = () => {
    const heights = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-4'
    };
    return heights[props.size || 'md'];
  };
  
  // Determine if we should show the built-in label
  const showBuiltInLabel = () => props.showLabel && !props.children;
  
  return (
    <div class={`w-full ${props.class || ''}`}>
      <div class={`w-full bg-background-light ${heightClass()} ${props.rounded ? 'rounded-full' : 'rounded'} overflow-hidden`}>
        <div
          class={`
            ${colorClass()}
            ${heightClass()}
            ${props.animate ? 'transition-all duration-300 ease-out' : ''}
            ${props.striped ? 'bg-striped' : ''}
            ${props.rounded ? 'rounded-full' : ''}
          `}
          style={{ width: `${safeProgress()}%` }}
          role="progressbar"
          aria-valuenow={safeProgress()}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      <Show when={showBuiltInLabel()}>
        <div class="mt-1 flex justify-between text-xs text-text-muted">
          <span>{props.label || 'Progress'}</span>
          <span>{safeProgress().toFixed(0)}%</span>
        </div>
      </Show>
      
      <Show when={props.children}>
        <div class="mt-1">
          {props.children}
        </div>
      </Show>
    </div>
  );
};

export default Bar;
