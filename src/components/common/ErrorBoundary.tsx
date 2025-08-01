import { createSignal, ErrorBoundary as SolidErrorBoundary, JSX } from 'solid-js';
import Button from '../widgets/Button';

interface ErrorBoundaryProps {
  children: JSX.Element;
}

export default function ErrorBoundary(props: ErrorBoundaryProps) {
  const [error, setError] = createSignal<Error | null>(null);

  const resetError = () => {
    setError(null);
  };

  const goHome = () => {
    resetError();
    window.location.href = '/';
  };

  return (
    <SolidErrorBoundary fallback={(err: Error) => (
      <div class="min-h-screen bg-background flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <div class="bg-background-darker rounded-lg shadow-lg p-8 text-center">
            <div class="flex justify-center mb-6">
              <svg class="h-24 w-24 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            
            <h1 class="text-3xl font-bold text-text mb-2">Something went wrong</h1>
            
            <p class="text-text-muted mb-4">
              An unexpected error has occurred. Please try again later.
            </p>
            
            <div class="bg-background-light rounded p-4 mb-6 overflow-auto text-left">
              <p class="text-danger font-mono text-sm">
                {err.message || 'Unknown error'}
              </p>
            </div>
            
            <div class="flex flex-col gap-4">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              
              <Button variant="secondary" onClick={goHome}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}>
      {props.children}
    </SolidErrorBoundary>
  );
} 