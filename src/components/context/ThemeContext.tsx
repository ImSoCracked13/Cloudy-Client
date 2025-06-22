import { createContext, useContext, createSignal, JSX, createEffect } from 'solid-js';

type Theme = 'dark' | 'neon';

interface ThemeContextType {
  theme: () => Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Create context with undefined initial value
const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: { children: JSX.Element }) {
  // Initialize theme from localStorage or default to dark
  const storedTheme = localStorage.getItem('theme') as Theme;
  const [theme, setTheme] = createSignal<Theme>(storedTheme || 'dark');

  // Update localStorage when theme changes
  createEffect(() => {
    const currentTheme = theme();
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Add/remove classes for theme-specific styling
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('neon-theme');
      // Reset to default from CSS
      document.body.style.background = ''; 
      document.body.style.color = '';
    } else {
      document.documentElement.classList.add('neon-theme');
      document.documentElement.classList.remove('dark-theme');
      // Apply gradient background directly to body for better compatibility
      document.body.style.background = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)';
      document.body.style.backgroundAttachment = 'fixed'; // Keep gradient fixed when scrolling
      document.body.style.color = 'var(--color-text)';
    }
    
    console.log(`Theme changed to: ${currentTheme}`);
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'neon' : 'dark');
  };

  const contextValue = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext)!;
} 