import { createSignal } from "solid-js";

// User types
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notificationsEnabled?: boolean;
}

// User state signals
const [user, setUser] = createSignal<User | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal<boolean>(false);
const [isLoading, setIsLoading] = createSignal<boolean>(true);
const [error, setError] = createSignal<string | null>(null);

// Create a mock store object that provides state access
export const userStore = {
  get state() {
    return {
      user: user(),
      isAuthenticated: isAuthenticated(),
      isLoading: isLoading(),
      error: error()
    };
  }
};

// Create mock actions to update the state
export const userActions = {
  setUser: (userData: User | null) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
  },
  setLoading: (loading: boolean) => setIsLoading(loading),
  setError: (errorMessage: string | null) => setError(errorMessage),
  updatePreferences: (preferences: Partial<UserPreferences>) => {
    const currentUser = user();
    if (currentUser) {
      setUser({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          ...preferences
        }
      });
    }
  },
  logout: () => {
    setUser(null);
    setIsAuthenticated(false);
  }
}; 