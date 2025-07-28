import { Show, createSignal, onMount } from 'solid-js';
import AuthWrapper from '../components/wrappers/AuthWrapper';
import Loading from '../components/common/Loading';

export default function Settings() {
  const [isLoading, setIsLoading] = createSignal(true);
  
  onMount(() => {
    // Simulate loading delay for navigation
    setTimeout(() => setIsLoading(false), 500);
  });

  return (
    <div class="min-h-screen bg-background">
      <Show when={!isLoading()} fallback={
        <div class="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loading size="lg" color="primary" text="Loading Settings..." />
        </div>
      }>
        <AuthWrapper type="settings" class="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12" />
      </Show>
    </div>
  );
} 