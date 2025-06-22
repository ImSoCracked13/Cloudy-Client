import { createEffect, onMount } from 'solid-js';
import { themeStore, themeActions } from '../stores/themeStore';

/**
 * Hook to use the theme store
 * Provides access to theme state and actions
 */
export function useTheme() {
  onMount(() => {
    // Initialize theme on first mount
    themeActions.initialize();
  });
  
  return {
    theme: () => themeStore.state.theme,
    prefersDarkMode: () => themeStore.state.systemPrefersDark,
    effectiveTheme: () => themeStore.state.effectiveTheme,
    setTheme: themeActions.setTheme,
    toggleTheme: themeActions.toggleTheme
  };
}

export default useTheme; 