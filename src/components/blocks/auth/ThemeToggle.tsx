import { Show } from 'solid-js';
import { useTheme } from '../../hooks/auth/useTheme';
import toastService from '../../common/Notification';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ThemeToggle(props: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  
  const isDark = () => theme() === 'dark';
  
  // Determine icon size based on prop
  const getIconSize = () => {
    switch (props.size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  // Get toggle switch size based on prop
  const getToggleSize = () => {
    switch (props.size) {
      case 'sm': return { width: 'w-12', height: 'h-6', circle: 'w-5 h-5' };
      case 'lg': return { width: 'w-16', height: 'h-8', circle: 'w-7 h-7' };
      default: return { width: 'w-14', height: 'h-7', circle: 'w-6 h-6' };
    }
  };

  // Helper to get translate-x for neon mode
  const getTranslateX = () => {
    switch (toggleSize.width) {
      case 'w-12': return 'translate-x-6'; // sm
      case 'w-16': return 'translate-x-8'; // lg
      default: return 'translate-x-7'; // md
    }
  };

  const handleToggleTheme = () => {
    const currentTheme = theme();
    toggleTheme();
    // Use setTimeout to ensure theme has been updated
    setTimeout(() => {
      const newTheme = theme();
      toastService.info(`Switched to ${newTheme === 'dark' ? 'dark' : 'neon'} mode`);
    }, 100);
  };
  const toggleSize = getToggleSize();

  return (
    <div class="flex items-center gap-3">
      <button
        onClick={handleToggleTheme}
        class={`relative inline-flex ${toggleSize.width} ${toggleSize.height} items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isDark() 
            ? 'bg-gray-600 hover:bg-gray-500' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
        }`}
        aria-label={isDark() ? 'Switch to neon mode' : 'Switch to dark mode'}
        title={isDark() ? 'Switch to neon mode' : 'Switch to dark mode'}
      >
        {/* Toggle circle with icon */}
        <div
          class={`${toggleSize.circle} transform rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center ${
            isDark() ? 'translate-x-1' : getTranslateX()
          }`}
        >
          <Show when={isDark()} fallback={
            // Neon sparkle icon with pulse
            <svg xmlns="http://www.w3.org/2000/svg" class={`${getIconSize()} text-pink-400 animate-pulse`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M6.757 17.243l-2.121 2.121m12.728 0l-2.121-2.121M6.757 6.757L4.636 4.636" />
            </svg>
          }>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class={`${getIconSize()} text-gray-600`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
              />
            </svg>
          </Show>
        </div>
      </button>

      {props.showLabel && (
        <span class="text-text font-medium">
          {isDark() ? 'Dark Mode' : 'Neon Mode'}
        </span>
      )}
    </div>
  );
}
