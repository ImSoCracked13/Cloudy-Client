import { createEffect, createSignal, onMount, Switch, Match } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { useLogout } from '../../hooks/auth/useLogout';
import Loading from '../../common/Loading';
import toastService from '../../common/Notification';

interface ProtectedStateProps {
  children: any;
  redirectTo?: string;
}

export default function ProtectedState(props: ProtectedStateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { logout } = useLogout();
  const [initialCheckComplete, setInitialCheckComplete] = createSignal(false);

  // Wait for initial auth check to complete
  onMount(() => {
    setTimeout(() => setInitialCheckComplete(true), 100);
  });

  // Idle logout logic
  onMount(() => {
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasLoggedOut = false;
    const IDLE_LIMIT = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      if (initialCheckComplete() && !currentUser.loading() && currentUser.user()) {
        idleTimeout = setTimeout(() => {
          if (!hasLoggedOut && currentUser.user()) {
            hasLoggedOut = true;
            logout();
            navigate('/login', { replace: true, state: { from: location.pathname } });
            toastService.warning('You have been logged out due to inactivity.');
          }
        }, IDLE_LIMIT);
      }
    };

    // List of events that indicate user activity
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimer));

    // Start the timer initially
    resetIdleTimer();

    // Cleanup
    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  });

  createEffect(() => {
    // Only act after initial check and when not loading
    if (initialCheckComplete() && !currentUser.loading()) {
      if (!currentUser.user()) {
        const redirectPath = props.redirectTo || '/login';
        const currentPath = location.pathname;
        
        if (currentPath !== redirectPath) {
          navigate(redirectPath, { 
            replace: true,
            state: { from: currentPath }
          });
        }
      }
    }
  });

  return (
    <Switch>
      {/* Authenticated state */}
      <Match when={currentUser.user()}>
        {props.children}
      </Match>

      {/* Unauthenticated state (will redirect via effect) */}
      <Match when={initialCheckComplete() && !currentUser.loading() && !currentUser.user()}>
        <div class="flex items-center justify-center h-screen">
          <Loading size="lg" />
        </div>
      </Match>
    </Switch>
  );
}