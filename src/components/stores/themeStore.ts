import { createSignal } from "solid-js";

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Theme state signals
const [theme, setTheme] = createSignal<ThemeMode>('system');
const [isInitialized, setIsInitialized] = createSignal<boolean>(false);
const [systemPrefersDark, setSystemPrefersDark] = createSignal<boolean>(
  typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : false
);

// Create a mock store object that provides state access
export const themeStore = {
  get state() {
    return {
      theme: theme(),
      isInitialized: isInitialized(),
      systemPrefersDark: systemPrefersDark(),
      effectiveTheme: getEffectiveTheme()
    };
  }
};

// Helper function to get the effective theme
function getEffectiveTheme(): 'light' | 'dark' {
  const currentTheme = theme();
  return currentTheme === 'system' 
    ? systemPrefersDark() ? 'dark' : 'light'
    : currentTheme;
}

// Create mock actions to update the state
export const themeActions = {
  setTheme: (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyThemeToDOM(getEffectiveTheme());
  },
  
  initialize: () => {
    if (typeof window === 'undefined' || isInitialized()) return;
    
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    
    // Set up system preference listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
      if (theme() === 'system') {
        applyThemeToDOM(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Apply initial theme
    applyThemeToDOM(getEffectiveTheme());
    setIsInitialized(true);
  },
  
  toggleTheme: () => {
    const currentTheme = theme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    themeActions.setTheme(newTheme);
  }
};

// Helper function to apply theme to DOM
function applyThemeToDOM(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove('light-theme', 'dark-theme');
  root.classList.add(theme === 'dark' ? 'dark-theme' : 'light-theme');
} 