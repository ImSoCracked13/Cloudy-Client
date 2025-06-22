import { createSignal, onMount, Show, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../components/context/AuthContext';
import { useTheme } from '../components/context/ThemeContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Card from '../components/widgets/Card';
import Button from '../components/widgets/Button';
import Input from '../components/widgets/Input';
import { notificationService } from '../components/common/Notification';
import { authService } from '../components/services/authService';
import Dialog from '../components/widgets/Dialog';

export default function Settings() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Account deletion
  const [deletePassword, setDeletePassword] = createSignal('');
  const [deleteConfirmText, setDeleteConfirmText] = createSignal('');
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal('');
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  
  // Logout
  const [isLoggingOut, setIsLoggingOut] = createSignal(false);
  
  // Debug user state when component mounts
  createEffect(() => {
    console.log('Settings - Auth State:', {
      user: state.user ? {
        id: state.user.id,
        email: state.user.email,
        username: state.user.username,
        authProvider: state.user.authProvider,
        isGoogleAccount: state.user?.authProvider === 'google'
      } : null,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading
    });
    
    // Check token for authProvider
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const decodedPayload = atob(tokenParts[1]);
          const payload = JSON.parse(decodedPayload);
          console.log('Token payload:', {
            id: payload.id,
            email: payload.email,
            authProvider: payload.authProvider
          });
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    // Force refresh user data
    if (state.isAuthenticated && state.user) {
      authService.getCurrentUser().then(user => {
        console.log('Refreshed user data:', user);
      }).catch(error => {
        console.error('Error refreshing user data:', error);
      });
    }
  });
  
  // Check if user is using Google auth
  const isGoogleAccount = () => {
    // First check user state
    if (state.user?.authProvider === 'google') {
      console.log('Detected Google account from user state');
      return true;
    }
    
    // Then check token as fallback
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const decodedPayload = atob(tokenParts[1]);
            const payload = JSON.parse(decodedPayload);
          console.log('Token auth provider check:', payload.authProvider);
            if (payload.authProvider === 'google') {
            console.log('Detected Google account from token');
              return true;
            }
          }
        } catch (error) {
          console.error('Error checking token for auth provider:', error);
        }
      }
    
    // If no Google auth detected, assume local account
    console.log('No Google auth detected, treating as local account');
    return false;
  };

  const openDeleteConfirmation = (e: Event) => {
    e.preventDefault();
    
    console.log('Delete confirmation for:', isGoogleAccount() ? 'Google account' : 'Local account');
    
    if (isGoogleAccount()) {
      // For Google accounts, check if "Delete" was typed
      if (deleteConfirmText() !== 'Delete') {
        setDeleteError('Please type "Delete" to confirm account deletion');
        return;
      }
    } else {
      // For local accounts, check password
      if (!deletePassword()) {
        setDeleteError('Password is required to delete your account');
        return;
      }
    }
    
    setDeleteError('');
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      // For Google accounts, pass 'Delete' as password, otherwise use the password field
      const passwordToUse = isGoogleAccount() ? 'Delete' : deletePassword();
      console.log('Deleting account with password:', passwordToUse ? '[PROVIDED]' : '[EMPTY]');
      
      await authService.deleteAccount(passwordToUse);
      await logout();
      navigate('/');
      notificationService.success('Your account has been deleted successfully');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      notificationService.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ProtectedRoute>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-text mb-8">Account Settings</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Toggle */}
          <Card>
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-text mb-4">Appearance</h2>
              
              <div class="flex items-center justify-between">
                <span class="text-text-muted">
                  Theme: <span class="text-text font-medium">{theme() === 'dark' ? 'Discord Default' : 'Gradient Neon'}</span>
                </span>
                
                <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="theme-toggle"
                    class="opacity-0 w-0 h-0"
                    checked={theme() === 'neon'}
                    onChange={toggleTheme}
                  />
                  <label
                    for="theme-toggle"
                    class={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${
                      theme() === 'neon' ? 'bg-primary' : 'bg-background-light'
                    }`}
                  >
                    <span
                      class={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                        theme() === 'neon' ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Account Type Info */}
          <Card>
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-text mb-4">Account Information</h2>
              
              <div class="flex items-center space-x-3">
                <span class="text-text-muted">Account Type:</span>
                <span class="text-text font-medium">
                  {isGoogleAccount() ? 'Google Account' : 'Local Account'}
                </span>
              </div>
              
              <div class="flex items-center space-x-3">
                <span class="text-text-muted">Email:</span>
                <span class="text-text font-medium">{state.user?.email}</span>
              </div>
              
              <div class="flex items-center space-x-3">
                <span class="text-text-muted">Username:</span>
                <span class="text-text font-medium">{state.user?.username}</span>
              </div>
              
              <div class="flex items-center space-x-3">
                <span class="text-text-muted">Auth Provider:</span>
                <span class="text-text font-medium">{state.user?.authProvider || 'Unknown'}</span>
              </div>
            </div>
          </Card>
          
          {/* Logout */}
          <Card>
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-text mb-4">Logout</h2>
              
              <p class="text-text-muted mb-4">
                Click the button below to log out of your account.
              </p>
              
              <div class="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={handleLogout}
                  disabled={isLoggingOut()}
                  loading={isLoggingOut()}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Danger Zone */}
          <Card class="col-span-1 lg:col-span-2 bg-background-darker border border-danger/20">
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-danger mb-4">Danger Zone</h2>
              
              <div class="bg-background p-4 rounded-md">
                <h3 class="text-lg font-medium text-text mb-2">Delete Account</h3>
                <p class="text-text-muted mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                <form onSubmit={openDeleteConfirmation} class="space-y-4">
                  <Show 
                    when={isGoogleAccount()}
                    fallback={
                      <Input
                        label="Enter your password to confirm deletion"
                        type="password"
                        value={deletePassword()}
                        onInput={(e) => setDeletePassword(e.currentTarget.value)}
                        fullWidth
                        showPasswordToggle
                      />
                    }
                  >
                    <Input
                      label="Type 'Delete' to confirm"
                      type="text"
                      value={deleteConfirmText()}
                      onInput={(e) => setDeleteConfirmText(e.currentTarget.value)}
                      fullWidth
                      placeholder="Type 'Delete' to confirm"
                    />
                  </Show>
                  
                  {deleteError() && (
                    <p class="text-danger text-sm">{deleteError()}</p>
                  )}
                  
                  <div class="flex justify-end">
                    <Button 
                      type="submit" 
                      variant="danger" 
                      disabled={isDeleting()}
                      loading={isDeleting()}
                    >
                      Delete Account
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Delete Account Confirmation Dialog */}
        <Dialog
          isOpen={showDeleteConfirm()}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Account Deletion"
        >
          <div class="space-y-4">
            <p class="text-text">
              Are you sure you want to delete your account? This action will:
            </p>
            <ul class="list-disc pl-5 text-text-muted space-y-1">
              <li>Permanently delete your account information</li>
              <li>Remove all your files from cloud storage</li>
              <li>Delete all your data records from the database</li>
              <li>This action cannot be undone</li>
            </ul>
            <div class="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting()}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting()}
                loading={isDeleting()}
              >
                Permanently Delete Account
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
} 