import { useNavigate } from '@solidjs/router';
import { useLogout } from '../../hooks/auth/useLogout';
import toastService from '../../common/Notification';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout, loading } = useLogout();

  const handleLogout = async () => {
    try {
      toastService.success('Logout successful');
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toastService.error('Failed to log out');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading()}
      class="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)] text-white font-medium py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading() ? 'Signing out...' : 'Logout'}
    </button>
  );
}
