import { useNavigate } from '@solidjs/router';
import { createEffect, JSX, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import Spinner from '../widgets/Spinner';

interface ProtectedRouteProps {
  children: JSX.Element;
  fallback?: JSX.Element;
}

export default function ProtectedRoute(props: ProtectedRouteProps) {
  const { state } = useAuth();
  const navigate = useNavigate();

  createEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      navigate('/login', { replace: true });
    }
  });

  return (
    <Show
      when={!state.isLoading && state.isAuthenticated}
      fallback={props.fallback || (
        <div class="flex justify-center items-center h-screen bg-background">
          <Spinner size="lg" />
        </div>
      )}
    >
      {props.children}
    </Show>
  );
} 