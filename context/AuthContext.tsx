import * as SecureStore from 'expo-secure-store';
import { createContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type User = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  authLoading: boolean;
  login: (accessToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AUTH_TOKEN_KEY = 'student_service_access_token';
const AUTH_USER_KEY = 'student_service_user';

function normalizeUser(
  payload: Record<string, any> | null | undefined,
  fallbackEmail?: string
): User {
  const userPayload =
    payload?.user ??
    payload?.profile ??
    payload?.data ??
    payload ??
    {};

  return {
    id:
      userPayload.id ??
      userPayload.userId ??
      userPayload.studentId ??
      userPayload._id,

    name:
      userPayload.name ??
      userPayload.fullName ??
      userPayload.displayName ??
      userPayload.username ??
      'Student',

    email:
      userPayload.email ??
      userPayload.emailAddress ??
      fallbackEmail,

    role:
      userPayload.role ??
      userPayload.userRole ??
      userPayload.type ??
      userPayload.position,
  };
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /**
   * Login
   *
   * Saves both:
   * - access token
   * - logged-in user's information
   */
  const login = async (
    accessToken: string,
    userData: User
  ) => {
    if (!accessToken) {
      throw new Error(
        'No access token was returned by the API.'
      );
    }

    const canUseSecureStore =
      Platform.OS !== 'web' &&
      (await SecureStore.isAvailableAsync().catch(() => false));

    if (canUseSecureStore) {
      try {
        // Save access token
        await SecureStore.setItemAsync(
          AUTH_TOKEN_KEY,
          accessToken
        );

        // Save logged-in user
        await SecureStore.setItemAsync(
          AUTH_USER_KEY,
          JSON.stringify(userData)
        );
      } catch (error) {
        console.warn('SecureStore save failed', error);

        throw new Error(
          'Unable to store the session securely on this device.'
        );
      }
    }

    // Update React state
    setToken(accessToken);
    setUser(userData ?? { name: 'Student' });
  };

  /**
   * Logout
   *
   * Removes both the token and the saved user.
   */
  const logout = async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(
          AUTH_TOKEN_KEY
        ).catch(() => undefined);

        await SecureStore.deleteItemAsync(
          AUTH_USER_KEY
        ).catch(() => undefined);
      }
    } catch (error) {
      console.warn('SecureStore delete failed', error);
    }

    // Clear React state
    setToken(null);
    setUser(null);
  };

  /**
   * Restore previous login session
   *
   * Instead of calling the fixed /profile mock,
   * this restores the exact user that logged in.
   */
  const restoreSession = async () => {
    setAuthLoading(true);

    try {
      // SecureStore is not used on web in this setup
      if (Platform.OS === 'web') {
        setToken(null);
        setUser(null);
        return;
      }

      const isAvailable =
        await SecureStore.isAvailableAsync().catch(
          () => false
        );

      if (!isAvailable) {
        setToken(null);
        setUser(null);
        return;
      }

      // Get saved access token
      const savedToken =
        await SecureStore.getItemAsync(
          AUTH_TOKEN_KEY
        );

      if (!savedToken) {
        setToken(null);
        setUser(null);
        return;
      }

      // Get saved user
      const savedUser =
        await SecureStore.getItemAsync(
          AUTH_USER_KEY
        );

      if (!savedUser) {
        // Token exists but user information doesn't.
        // Clear the invalid/incomplete session.
        await SecureStore.deleteItemAsync(
          AUTH_TOKEN_KEY
        ).catch(() => undefined);

        setToken(null);
        setUser(null);
        return;
      }

      // Convert saved JSON back into a User object
      const parsedUser: User = JSON.parse(savedUser);

      // Restore session
      setToken(savedToken);
      setUser(parsedUser);
    } catch (error) {
      console.warn(
        'Session restore failed',
        error
      );

      // If anything goes wrong, clear the session
      setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Restore session when AuthProvider starts
   */
  useEffect(() => {
    void restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        authLoading,
        login,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}