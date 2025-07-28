import { createSignal, createEffect } from 'solid-js';
import { useAuthHandler } from '../../handlers/AuthHandler';
import ThemeToggle from '../../blocks/auth/ThemeToggle';
import LogoutButton from '../../blocks/auth/LogoutButton';
import DeleteAccountButton from '../../blocks/auth/DeleteAccountButton';

interface User {
  email?: string;
  provider?: string;
  createdAt?: string;
  emailVerified?: boolean;
  isVerified?: boolean;
  authProvider?: string;
}

export default function SettingsManager() {
  const authHandler = useAuthHandler();
  const [user, setUser] = createSignal<User | null>(authHandler.user());
  
  createEffect(() => {
    setUser(authHandler.user());
  });
  
  const isGoogleUser = () => {
    const currentUser = user();
    return currentUser?.provider === 'google' || currentUser?.authProvider === 'google';
  };
  
  const getAccountType = () => {
    if (isGoogleUser()) {
      return 'Google';
    }
    return 'Local';
  };

  return (
    <div class="w-full max-w-[1440px] mx-auto p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
        {/* Top Left - Appearance */}
        <div class="p-8 bg-background shadow-lg rounded-xl border border-border h-56">
          <div class="flex items-center justify-between h-full">
            <div class="flex-1">
              <h2 class="text-2xl font-bold mb-3 text-text">Appearance</h2>
              <h3 class="text-lg font-semibold mb-2 text-text">Theme Mode</h3>
              <p class="text-text-muted">Choose between dark and neon mode for your interface</p>
            </div>
            <div class="ml-8">
              <ThemeToggle size="lg" />
            </div>
          </div>
        </div>

        {/* Top Right - Account Information */}
        <div class="p-8 bg-background shadow-lg rounded-xl border border-border h-56">
          <h2 class="text-2xl font-bold mb-4 text-text">Account Information</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-sm font-medium text-text-muted mb-1">Email Address</p>
                <p class="text-base font-semibold text-text break-all">{user()?.email || 'N/A'}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-text-muted mb-1">Account Type</p>
                <p class="text-base font-semibold text-text">{getAccountType()}</p>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-text-muted mb-1">Email Verification Status</p>
              <p class="text-base font-semibold">
                {user()?.isVerified || user()?.emailVerified || isGoogleUser() ? (
                  <span class="text-green-500">✓ Verified</span>
                ) : (
                  <span class="text-red-500">✗ Not Verified</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Left - Account Actions */}
        <div class="p-8 bg-background shadow-lg rounded-xl border border-border h-56">
          <div class="flex items-center justify-between h-full">
            <div class="flex-1">
              <h2 class="text-2xl font-bold mb-3 text-text">Account Actions</h2>
              <h3 class="text-lg font-semibold mb-2 text-text">Sign Out</h3>
              <p class="text-text-muted">End your current session and return to the login page</p>
            </div>
            <div class="ml-8">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Bottom Right - Danger Zone */}
        <div class="p-8 bg-background shadow-lg rounded-xl border border-border border-red-500/20 h-56">
          <div class="flex items-center justify-between h-full">
            <div class="flex-1">
              <h2 class="text-2xl font-bold mb-3 text-red-500">Danger Zone</h2>
              <h3 class="text-lg font-semibold mb-2 text-red-500">Delete Account</h3>
              <p class="text-text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <div class="ml-8">
              <DeleteAccountButton isGoogleUser={isGoogleUser()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}