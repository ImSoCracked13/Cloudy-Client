import { ErrorBoundary, onMount, createSignal } from 'solid-js';
import { Router, RouteSectionProps } from '@solidjs/router';
import { ThemeProvider } from './components/context/ThemeContext';
import { AuthProvider } from './components/context/AuthContext';
import AppRoutes from './routes/Router';
import Notification from './components/common/Notification';
import emailjs from '@emailjs/browser';

// Create a global flag to track EmailJS initialization
const [isEmailJSInitialized, setIsEmailJSInitialized] = createSignal(false);

// Export a function to check if EmailJS is ready
export function isEmailJSReady(): boolean {
  return isEmailJSInitialized();
}

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
    // Initialize EmailJS with direct configuration
    try {
      // EmailJS configuration values from environment variables
      const EMAIL_JS_CONFIG = {
        SERVICE_ID: import.meta.env.VITE_EMAIL_SERVICE_ID || 'service_ege9r9v',
        TEMPLATE_ID: import.meta.env.VITE_EMAIL_TEMPLATE_ID || 'template_srq2imp',
        PUBLIC_KEY: import.meta.env.VITE_EMAIL_PUBLIC_KEY || 'Ajpl74OWTk5bSN3zp'
      };
      
      console.log('Initializing EmailJS with configuration from environment variables');
      
      const emailJSOptions = {
        publicKey: EMAIL_JS_CONFIG.PUBLIC_KEY,
        blockHeadless: false,
        validateParams: true,
        limitRate: {
          throttle: 10000, // 10s
        }
      };
      
      emailjs.init(emailJSOptions);
      setIsEmailJSInitialized(true);
      console.log('EmailJS initialized successfully');
      
      // Log configuration for debugging
      console.log('EmailJS configuration:', {
        'SERVICE_ID': EMAIL_JS_CONFIG.SERVICE_ID,
        'TEMPLATE_ID': EMAIL_JS_CONFIG.TEMPLATE_ID,
        'PUBLIC_KEY': EMAIL_JS_CONFIG.PUBLIC_KEY
      });
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
    }
    
    // Log auth token for debugging
    const token = localStorage.getItem('authToken');
    console.log('Auth token present on app initialization:', !!token);
    console.log('Auth token length:', token ? token.length : 0);
    
    // Always enable persistent login
    localStorage.setItem('persistentLogin', 'true');
    
    if (token) {
      const tokenParts = token.split('.');
      console.log('Token parts count:', tokenParts.length);
      try {
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', {
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none',
            userId: payload.id || 'none',
            issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'none'
          });
          
          // Check if token is expired but don't remove it - we'll let AuthContext handle this
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.warn('Token appears expired, but keeping it for persistent login');
          }
        }
      } catch (error) {
        console.error('Error parsing token payload:', error);
      }
    }
  });
  
  return (
    <ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
      <Router root={RootLayout}>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
