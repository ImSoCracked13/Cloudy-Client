import { A } from '@solidjs/router';
import ErrorBoundary from '../components/common/ErrorBoundary';

interface ErrorPageProps {
  code?: number;
  message?: string;
}

export default function Error(props: ErrorPageProps) {
  const errorCode = props.code || 404;
  const errorMessage = props.message || 'Page not found';
  
  return (
    <div class="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <ErrorBoundary>
        <div class="space-y-6">
          <h1 class="text-6xl font-bold text-primary">{errorCode}</h1>
          <h2 class="text-2xl font-medium">{errorMessage}</h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find the page you were looking for. Please check the URL or navigate back to the home page.
          </p>
          <div class="mt-6">
            <A 
              href="/"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Return Home
            </A>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
} 