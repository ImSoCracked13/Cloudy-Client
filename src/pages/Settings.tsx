import { createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../components/context/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Card from '../components/widgets/Card';
import Button from '../components/widgets/Button';
import Input from '../components/widgets/Input';
import { notificationService } from '../components/common/Notification';
import { authService } from '../components/services/authService';

export default function Settings() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  
  // Profile settings
  const [username, setUsername] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [updateError, setUpdateError] = createSignal('');
  
  // Password change
  const [currentPassword, setCurrentPassword] = createSignal('');
  const [newPassword, setNewPassword] = createSignal('');
  const [confirmNewPassword, setConfirmNewPassword] = createSignal('');
  const [isChangingPassword, setIsChangingPassword] = createSignal(false);
  const [passwordError, setPasswordError] = createSignal('');
  
  // Account deletion
  const [deletePassword, setDeletePassword] = createSignal('');
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal('');
  
  onMount(() => {
    if (state.user) {
      setUsername(state.user.username);
      setEmail(state.user.email);
    }
  });

  const handleUpdateProfile = async (e: Event) => {
    e.preventDefault();
    
    if (!username() || !email()) {
      setUpdateError('Username and email are required');
      return;
    }
    
    setIsUpdating(true);
    setUpdateError('');
    
    try {
      await authService.updateProfile({
        username: username(),
        email: email()
      });
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    
    if (!currentPassword()) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword()) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword() !== confirmNewPassword()) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    
    try {
      await authService.changePassword(currentPassword(), newPassword());
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: Event) => {
    e.preventDefault();
    
    if (!deletePassword()) {
      setDeleteError('Password is required to delete your account');
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await authService.deleteAccount(deletePassword());
      await logout();
      navigate('/');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-text mb-8">Account Settings</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card>
            <form onSubmit={handleUpdateProfile} class="space-y-4">
              <h2 class="text-xl font-semibold text-text mb-4">Profile Settings</h2>
              
              <Input
                label="Username"
                type="text"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
                fullWidth
              />
              
              <Input
                label="Email"
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                fullWidth
              />
              
              {updateError() && (
                <p class="text-danger text-sm">{updateError()}</p>
              )}
              
              <div class="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdating()}
                  loading={isUpdating()}
                >
                  Update Profile
                </Button>
              </div>
            </form>
          </Card>
          
          {/* Password Change */}
          <Card>
            <form onSubmit={handleChangePassword} class="space-y-4">
              <h2 class="text-xl font-semibold text-text mb-4">Change Password</h2>
              
              <Input
                label="Current Password"
                type="password"
                value={currentPassword()}
                onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                fullWidth
                showPasswordToggle
              />
              
              <Input
                label="New Password"
                type="password"
                value={newPassword()}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                fullWidth
                showPasswordToggle
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword()}
                onInput={(e) => setConfirmNewPassword(e.currentTarget.value)}
                fullWidth
                showPasswordToggle
              />
              
              {passwordError() && (
                <p class="text-danger text-sm">{passwordError()}</p>
              )}
              
              <div class="flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword()}
                  loading={isChangingPassword()}
                >
                  Change Password
                </Button>
              </div>
            </form>
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
                
                <form onSubmit={handleDeleteAccount} class="space-y-4">
                  <Input
                    label="Enter your password to confirm"
                    type="password"
                    value={deletePassword()}
                    onInput={(e) => setDeletePassword(e.currentTarget.value)}
                    fullWidth
                    showPasswordToggle
                  />
                  
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
      </div>
    </ProtectedRoute>
  );
} 