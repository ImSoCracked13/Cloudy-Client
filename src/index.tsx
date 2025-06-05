/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';

// Import UnoCSS styles
import 'uno.css';
import '@unocss/reset/tailwind.css';
// Import our custom styles
import './components/styles/Theme.css';

// Initialize the application
const initApp = () => {
  // Check for dark mode preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Apply theme based on saved preference or system preference
  document.documentElement.classList.toggle(
    'dark', 
    savedTheme === 'dark' || (!savedTheme && prefersDarkMode)
  );
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.classList.toggle('dark', e.matches);
    }
  });
};

// Initialize app settings
initApp();

// Mount the app
const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App />, root!);
