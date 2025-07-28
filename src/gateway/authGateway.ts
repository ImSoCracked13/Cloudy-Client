import { createResource, createRoot } from 'solid-js';
import { LoginCredentials, RegisterCredentials, GoogleAuthResponse, User } from '../types/authType';

// Get environment-specific URLs
const API_URL = import.meta.env.VITE_API_BASE_URL;
const IS_PRODUCTION = import.meta.env.VITE_IS_PRODUCTION;

// In production, we use relative URLs since Vercel handles the proxy
const BASE_API_PATH = IS_PRODUCTION ? '/api' : `${API_URL}/api`;

/**
 * Helper to get the auth token
 */
function getAuthToken(): string | null {
  // Check both localStorage and sessionStorage for the token
  const localToken = localStorage.getItem('authToken');
  const sessionToken = sessionStorage.getItem('authToken');
  const token = localToken || sessionToken;
  return token;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Resource fetchers
const fetchCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    console.log('Fetching current user with token');
    const response = await fetch(`${BASE_API_PATH}/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.log('Token invalid or expired, clearing...');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        return null; // Explicitly return null for invalid auth
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const user = data.data?.user || data.user;
    
    if (!user) {
      console.log('No user data in response');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return undefined;
  }
};

const fetchRegister = async (credentials: RegisterCredentials) => {
  const response = await fetch(`${BASE_API_PATH}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

const fetchLogin = async (credentials: LoginCredentials) => {
  const response = await fetch(`${BASE_API_PATH}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(credentials),
  });
  const data = await handleResponse(response);
  if (data.data?.token) {
    localStorage.setItem('authToken', data.data.token);
  }
  return data.data;
};

const fetchGoogleAuth = async (response: GoogleAuthResponse) => {
  const tokenToSend = response.credential || response.token;
  if (!tokenToSend) {
    throw new Error('Google authentication failed: No valid token');
  }

  const apiResponse = await fetch(`${BASE_API_PATH}/users/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify({
      token: tokenToSend,
      email: response.email,
      name: response.name,
      sub: response.sub,
      picture: response.picture
    }),
  });
  return handleResponse(apiResponse);
};

const fetchLogout = async () => {
  const token = getAuthToken();
  if (!token) return true;

  const response = await fetch(`${BASE_API_PATH}/users/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
    credentials: 'include',
  });

  if (response.status === 404) {
    console.warn('Logout endpoint not found (404), but continuing with client-side logout');
    return true;
  }

  return response.ok;
};

const fetchVerifyEmail = async (token: string) => {
  const response = await fetch(`${BASE_API_PATH}/users/verify/${token}`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
  });
  return handleResponse(response);
};

const fetchSendVerificationEmail = async (email: string) => {
  const response = await fetch(`${BASE_API_PATH}/users/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

const fetchDeleteAccount = async (password: string) => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_API_PATH}/users/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    mode: 'cors',
    body: JSON.stringify({ password }),
    credentials: 'include',
  });
  
  return handleResponse(response);
};

// Create root for resources
const authRoot = createRoot(() => {
  // Initialize currentUser resource - will respect public route checking in fetchCurrentUser
  const [currentUserResource, { refetch: refetchCurrentUser }] = createResource(true, () => fetchCurrentUser());
  const [registerResource, { refetch: refetchRegister }] = createResource<RegisterCredentials, any>(() => null, fetchRegister);
  const [loginResource, { refetch: refetchLogin }] = createResource<LoginCredentials, any>(() => null, fetchLogin);
  const [googleAuthResource, { refetch: refetchGoogleAuth }] = createResource<GoogleAuthResponse, any>(() => null, fetchGoogleAuth);
  const [logoutResource, { refetch: refetchLogout }] = createResource(() => null);
  const [verifyEmailResource, { refetch: refetchVerifyEmail }] = createResource<string, any>(() => null, fetchVerifyEmail);
  const [sendVerificationResource, { refetch: refetchSendVerification }] = createResource<string, any>(() => null, fetchSendVerificationEmail);
  const [deleteAccountResource, { refetch: refetchDeleteAccount }] = createResource<string, any>(() => null, fetchDeleteAccount);

  return {
    currentUserResource,
    refetchCurrentUser,
    registerResource,
    refetchRegister,
    loginResource,
    refetchLogin,
    googleAuthResource,
    refetchGoogleAuth,
    logoutResource,
    refetchLogout,
    verifyEmailResource,
    refetchVerifyEmail,
    sendVerificationResource,
    refetchSendVerification,
    deleteAccountResource,
    refetchDeleteAccount
  };
});

/**
 * Authentication Gateway - Handles all API calls related to user authentication
 */
const authGateway = {
  // Resource getters
  getCurrentUserResource: () => authRoot.currentUserResource,
  getRegisterResource: () => authRoot.registerResource,
  getLoginResource: () => authRoot.loginResource,
  getGoogleAuthResource: () => authRoot.googleAuthResource,
  getLogoutResource: () => authRoot.logoutResource,
  getVerifyEmailResource: () => authRoot.verifyEmailResource,
  getSendVerificationResource: () => authRoot.sendVerificationResource,
  getDeleteAccountResource: () => authRoot.deleteAccountResource,

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<{ user: User | null; message: string; verificationRequired?: boolean }> {
    try {
      const data = await fetchRegister(credentials);
      console.log('Registration response:', data);

      // Store verification token if available
      if (data.data?.verificationToken) {
        localStorage.setItem('verification_token', data.data.verificationToken);
      }

      // Store email for verification
      if (credentials.email) {
        localStorage.setItem('pending_verification_email', credentials.email);
      }

      // Refetch current user and registration resource
      await Promise.all([
        authRoot.refetchCurrentUser(),
        authRoot.refetchRegister()
      ]);

      return {
        user: data.data?.user || null,
        message: data.message || 'Registration successful',
        verificationRequired: data.data?.verificationRequired || false
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login with username/email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Validate credentials
      if (!credentials?.loginIdentifier?.trim()) {
        throw new Error('Username or email is required');
      }
      
      if (!credentials?.password?.trim()) {
        throw new Error('Password is required');
      }

      // If a same google email exists, throw an error
      const currentUserData = authRoot.currentUserResource();
      if (currentUserData?.email === credentials.loginIdentifier && currentUserData?.authProvider === 'google') {
        throw new Error('A user with this email already exists');
      }
      
      // Create payload
      const payload = {
        loginIdentifier: credentials.loginIdentifier.trim(),
        password: credentials.password.trim()
      };
      
      console.log('Login attempt with:', { 
        loginIdentifier: payload.loginIdentifier,
        apiPath: `${BASE_API_PATH}/users/login`
      });
      
      const data = await fetchLogin(payload);
      
      // Refetch current user and login resource
      await Promise.all([
        authRoot.refetchCurrentUser(),
        authRoot.refetchLogin()
      ]);
      
      if (!data.user) {
        throw new Error('No user data received from server');
      }
      
      // Add token to user object for service layer
      return {
        ...data.user,
        token: data.token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Google authentication
   */
  async googleAuth(response: GoogleAuthResponse): Promise<{ user: User; token: string } | null> {
    try {
      console.log('Sending Google auth request with:', {
        hasToken: !!response.token,
        hasCredential: !!response.credential,
        email: response.email,
        name: response.name,
        sub: response.sub
      });

      // If a same google email exists in local, throw an error
      const currentUserData = authRoot.currentUserResource();
      if (currentUserData?.email === response.email && currentUserData?.authProvider === 'local') {
        throw new Error('A user with this email already exists');
      }

      const result = await fetchGoogleAuth(response);
      
      if (result && result.data) {
        // Store the token
        localStorage.setItem('authToken', result.data.token);
        
        // Refetch current user and google auth resource
        await Promise.all([
          authRoot.refetchCurrentUser(),
          authRoot.refetchGoogleAuth()
        ]);
        
        // Return the standardized response
        return {
          user: result.data.user,
          token: result.data.token
        };
      }
      
      return null;
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<boolean> {
    try {
      const result = await fetchLogout();
      
      // Clear local storage and session storage
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Refetch resources after logout
      await Promise.all([
        authRoot.refetchCurrentUser(),
        authRoot.refetchLogout()
      ]);
      
      console.log('Logout successful');
      return result;
    } catch (error) {
      console.error('Logout error in gateway:', error);
      return true;
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<any> {
    try {
      const result = await fetchVerifyEmail(token);
      console.log('Email verification response:', result);
      
      // Refetch resources after email verification
      await Promise.all([
        authRoot.refetchCurrentUser(),
        authRoot.refetchVerifyEmail()
      ]);
      
      return result;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  /**
   * Resend verification email
   */
  async sendVerificationEmail(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    
    try {
      const result = await fetchSendVerificationEmail(email);

      // Refetch send verification resource
      await Promise.all([
        authRoot.refetchCurrentUser(),
        authRoot.refetchSendVerification()
      ]);

      console.log('Send verification email response data:', result);
      return result; // Return the full result object including token
    } catch (error) {
      console.error('Send verification email error in gateway:', error);
      throw error;
    }
  },

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<boolean> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');
      console.log('Sending account deletion request to server...');
      const result = await fetchDeleteAccount(password);
      
      // If success, clear storage and refetch resources
      if (result.success) {
        // Clear auth token and other stored data
        localStorage.clear();
        
        // Refetch resources after account deletion
        await Promise.all([
          authRoot.refetchCurrentUser(),
          authRoot.refetchDeleteAccount()
        ]);
      } else {
        throw new Error(result.message || 'Failed to delete account');
      }
      
      return true;
    } catch (error) {
      console.error('Delete account error in gateway:', error);
      throw error;
    }
  },

    /**
   * Get current user information
   */
    async getCurrentUser(): Promise<User | null> {
      return authRoot.currentUserResource();
    },
}; 

export { authGateway };
export type { LoginCredentials, RegisterCredentials, User, GoogleAuthResponse }; 