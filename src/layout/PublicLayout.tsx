import { JSX } from 'solid-js';
import { A } from '@solidjs/router';
import { useTheme } from '../components/context/ThemeContext';

export default function PublicLayout(props: { children?: JSX.Element }) {
  const themeContext = useTheme();
  const isNeonTheme = () => themeContext?.theme() === 'neon';
  
  return (
    <div class={`min-h-screen flex flex-col ${isNeonTheme() ? 'neon-theme' : ''}`}>
      {/* Header */}
      <header class={`py-3 px-4 flex justify-between items-center shadow-md z-10 ${isNeonTheme() ? 'bg-background-darkest border-b border-primary/20' : 'bg-background-darkest'}`}>
        <div class="flex items-center">
          <A href="/" class="flex items-center gap-2">
            <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
            </svg>
            <h1 class="text-xl font-bold text-text">Cloudy</h1>
          </A>
        </div>
        
        <div class="flex items-center gap-4">
          <A 
            href="/login" 
            class="text-sm text-text-muted hover:text-text"
          >
            Login
          </A>
          
          <A 
            href="/register" 
            class={`text-sm px-3 py-1 rounded ${isNeonTheme() ? 'bg-primary text-black hover:bg-primary-hover' : 'bg-primary hover:bg-primary-hover text-white'}`}
          >
            Register
          </A>
        </div>
      </header>
      
      {/* Main Content */}
      <div class="flex flex-1 relative">
        <main class="flex-1 overflow-auto">
          {props.children}
        </main>
      </div>
      
      {/* Footer */}
      <footer class={`py-4 px-6 ${isNeonTheme() ? 'bg-background-darkest border-t border-primary/20' : 'bg-background-darkest'}`}>
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p class="text-text-muted text-sm">&copy; {new Date().getFullYear()} Cloudy. All rights reserved.</p>
          <div class="flex gap-6 mt-4 md:mt-0">
            <A href="/" class="text-text-muted hover:text-text text-sm">Home</A>
            <A href="/about" class="text-text-muted hover:text-text text-sm">About</A>
            <A href="/login" class="text-text-muted hover:text-text text-sm">Login</A>
            <A href="/register" class="text-text-muted hover:text-text text-sm">Register</A>
          </div>
        </div>
      </footer>
    </div>
  );
} 