import { createEffect, onMount } from 'solid-js';
import { authStore } from '../../store/AuthStore';
import '../../../styles/Theme.css';

// Theme types
export type Theme = 'dark' | 'neon';

// Initialize theme from localStorage or system preference
const initializeTheme = () => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  
  if (savedTheme && (savedTheme === 'dark' || savedTheme === 'neon')) {
    authStore.setTheme(savedTheme);
    return savedTheme;
  }
  
  // Default to dark theme if no saved preference
  const defaultTheme: Theme = 'dark';
  authStore.setTheme(defaultTheme);
  localStorage.setItem('theme', defaultTheme);
  return defaultTheme;
};

// Apply theme to document
const applyTheme = (newTheme: Theme) => {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove('dark', 'neon');
  
  // Add the new theme class
  root.classList.add(newTheme);
  
  // Save to localStorage
  localStorage.setItem('theme', newTheme);
};

export function useTheme() {
  // Initialize theme on mount
  onMount(() => {
    const initialTheme = initializeTheme();
    applyTheme(initialTheme);
  });

  // Apply theme whenever it changes
  createEffect(() => {
    applyTheme(authStore.state.theme);
  });

  const toggleTheme = () => {
    const currentTheme = authStore.state.theme;
    const newTheme: Theme = currentTheme === 'dark' ? 'neon' : 'dark';
    authStore.setTheme(newTheme);
  };

  return {
    theme: () => authStore.state.theme,
    toggleTheme,
    setTheme: authStore.setTheme
  };
}
