import { ErrorBoundary, JSX, onMount } from 'solid-js';
import { Router, RouteSectionProps } from '@solidjs/router';
import { ThemeProvider } from './components/context/ThemeContext';
import { AuthProvider } from './components/context/AuthContext';
import StaticErrorPage from './components/common/StaticErrorPage';
import AppRoutes from './routes/Router';
import Notification from './components/common/Notification';
import emailjs from '@emailjs/browser';

// Root layout component
function RootLayout(props: RouteSectionProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {props.children}
        <Notification />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  // Initialize EmailJS on mount
  onMount(() => {
    const userId = import.meta.env.VITE_EMAILJS_USER_ID;
    if (userId) {
      emailjs.init(userId);
      console.log('EmailJS initialized with user ID');
    } else {
      console.error('EmailJS user ID not found in environment variables');
    }
  });

  return (
    <ErrorBoundary fallback={(err) => (
      <StaticErrorPage 
        code={500}
        message={err instanceof Error ? err.message : String(err)}
      />
    )}>
      <Router root={RootLayout}>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
