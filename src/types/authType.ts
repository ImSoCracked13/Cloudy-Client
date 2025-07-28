export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  authProvider: 'local' | 'google';
  googleId?: string | null;
  avatar?: string | null;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (5GB default)
  createdAt: string;
  updatedAt: string;
  token?: string; // Auth token returned from server
}

export interface LoginCredentials {
  loginIdentifier: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  authProvider?: 'local' | 'google';
}

export interface RegisterResult {
  user?: any;
  token?: string;
  message?: string;
  verificationRequired?: boolean;
}

export interface GoogleAuthResponse {
  token?: string;
  credential?: string;
  email?: string;
  name?: string;
  sub?: string;
  picture?: string;
}