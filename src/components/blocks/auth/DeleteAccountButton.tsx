import { createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useDeleteAccount } from '../../hooks/auth/useDeleteAccount';
import toastService from '../../common/Notification';

interface DeleteAccountButtonProps {
  isGoogleUser: boolean;
}

export default function DeleteAccountButton(props: DeleteAccountButtonProps) {
  const navigate = useNavigate();
  const { deleteAccount, loading } = useDeleteAccount();
  
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [password, setPassword] = createSignal('');
  const [confirmPhrase, setConfirmPhrase] = createSignal('');

  const handleDeleteAccount = async () => {
    if (!props.isGoogleUser && !password()) {
      toastService.error('Please enter your password');
      return;
    }

    if (props.isGoogleUser && confirmPhrase() !== 'DELETE') {
      toastService.error('Please type "DELETE" to confirm');
      return;
    }

    try {
      await deleteAccount(props.isGoogleUser ? 'google-auth' : password());
      setShowConfirm(false);
      navigate('/', { replace: true });
      toastService.success('Account deleted successfully');
    } catch (error) {
      toastService.error('Failed to delete account');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        class="bg-[var(--color-danger)] hover:opacity-90 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
      >
        Delete Account
      </button>

      <Show when={showConfirm()}>
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 class="text-xl font-bold text-white mb-4">Delete Account</h2>
            <p class="text-gray-300 mb-6">
              This action cannot be undone. All your data will be permanently deleted.
            </p>

            <div class="space-y-4">
              <Show when={!props.isGoogleUser}>
                <div>
                  <label class="block text-sm text-gray-400 mb-2">
                    Enter your password to confirm deletion
                  </label>
                  <input
                    type="password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    class="w-full bg-gray-800/50 border-0 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    placeholder="Your current password"
                  />
                </div>
              </Show>

              <Show when={props.isGoogleUser}>
                <div>
                  <label class="block text-sm text-gray-400 mb-2">
                    Type <span class="font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmPhrase()}
                    onInput={(e) => setConfirmPhrase(e.currentTarget.value)}
                    class="w-full bg-gray-800/50 border-0 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    placeholder="DELETE"
                  />
                </div>
              </Show>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  class="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)] text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading() || 
                    (!props.isGoogleUser && !password()) || 
                    (props.isGoogleUser && confirmPhrase() !== 'DELETE')}
                  class="bg-[var(--color-danger)] hover:opacity-90 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading() ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
