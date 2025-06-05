import { JSX } from 'solid-js';

interface CardProps {
  title?: string;
  children: JSX.Element;
  footer?: JSX.Element;
  class?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card(props: CardProps) {
  const variant = props.variant || 'default';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-background-darker shadow-lg border border-background-light/15 shadow-black/20';
      case 'outlined':
        return 'bg-transparent border-2 border-background-light/30';
      default:
        return 'bg-background-darker border border-background-light/15 shadow-md shadow-black/10';
    }
  };

  return (
    <div 
      class={`
        rounded-lg overflow-hidden
        ${getVariantClasses()}
        ${props.hoverable ? 'hover:translate-y-[-3px] hover:shadow-xl transition-all duration-300 cursor-pointer' : ''}
        ${props.class || ''}
      `}
      onClick={props.onClick}
      role={props.onClick ? 'button' : 'region'}
      tabIndex={props.onClick ? 0 : undefined}
      aria-label={props.title}
      onKeyDown={props.onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onClick?.();
        }
      } : undefined}
    >
      {props.title && (
        <div class="border-b border-background-light/20 p-4">
          <h3 class="text-lg font-semibold text-text">{props.title}</h3>
        </div>
      )}
      
      <div class="p-4">
        {props.children}
      </div>
      
      {props.footer && (
        <div class="border-t border-background-light/20 p-4 bg-background-light/10">
          {props.footer}
        </div>
      )}
    </div>
  );
} 