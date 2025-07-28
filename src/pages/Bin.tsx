import { Show, createSignal, onMount } from 'solid-js';
import FileWrapper from '../components/wrappers/FileWrapper';
import Loading from '../components/common/Loading';

export default function Bin() {
  const [isLoading, setIsLoading] = createSignal(true);
  
  onMount(() => {
    // Simulate loading delay for navigation
    setTimeout(() => setIsLoading(false), 500);
  });

  return (
    <div class="min-h-screen bg-background">
      <Show when={!isLoading()} fallback={
        <div class="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loading size="lg" color="primary" text="Loading Bin..." />
        </div>
      }>
        <h1 class="text-4xl font-bold text-white p-4">Bin</h1>
        <FileWrapper type="bin" class="m-4" />
      </Show>
    </div>
  );
} 