import { useNavigate } from '@solidjs/router';
import Button from '../components/widgets/Button';

export interface ErrorPageProps {
  code?: number;
  message?: string;
}

export default function Error(props: ErrorPageProps) {
  const navigate = useNavigate();
  
  const errorCode = props.code || 404;
  const errorMessage = props.message || 'The page you are looking for could not be found.';

  const getErrorTitle = () => {
    switch (errorCode) {
      case 404:
        return 'Page Not Found';
      case 403:
        return 'Access Denied';
      case 500:
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  const getErrorIcon = () => {
    switch (errorCode) {
      case 404:
        return (
          <svg class="h-24 w-24 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
        );
      case 403:
        return (
          <svg class="h-24 w-24 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
        );
      case 500:
        return (
          <svg class="h-24 w-24 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg class="h-24 w-24 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-background-darker rounded-lg shadow-lg p-8 text-center">
          <div class="flex justify-center mb-6">
            {getErrorIcon()}
          </div>
          
          <h1 class="text-4xl font-bold text-text mb-2">{errorCode}</h1>
          <h2 class="text-2xl font-bold text-text mb-4">{getErrorTitle()}</h2>
          
          <p class="text-text-muted mb-8">
            {errorMessage}
          </p>
          
          <div class="flex flex-col gap-4">
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
            
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 