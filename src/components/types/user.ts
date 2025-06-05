export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  authProvider: 'local' | 'google';
  googleId?: string | null;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (5GB default)
  formattedStorageUsed?: string;
  formattedStorageLimit?: string;
  storagePercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  authProvider?: 'local' | 'google';
}

export interface VerificationData {
  token: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GoogleAuthResponse {
  token?: string;
  credential?: string;
  email?: string;
  name?: string;
  sub?: string;
} 