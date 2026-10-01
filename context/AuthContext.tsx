import { API_BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
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

function normalizeUser(payload: Record<string, any> | null | undefined, fallbackEmail?: string): User {
  const userPayload = payload?.user ?? payload?.profile ?? payload?.data ?? payload ?? {};

  return {
    id: userPayload.id ?? userPayload.userId ?? userPayload.studentId ?? userPayload._id,
    name: userPayload.name ?? userPayload.fullName ?? userPayload.displayName ?? userPayload.username ?? 'Student',
    email: userPayload.email ?? userPayload.emailAddress ?? fallbackEmail,
    role: userPayload.role ?? userPayload.userRole ?? userPayload.type ?? userPayload.position,
  };
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const login = async (accessToken: string, userData: User) => {
    if (!accessToken) {
      throw new Error('No access token was returned by the API.');
    }

    const canUseSecureStore = Platform.OS !== 'web' && (await SecureStore.isAvailableAsync().catch(() => false));

    if (canUseSecureStore) {
      try {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
      } catch (error) {
        console.warn('SecureStore save failed', error);
        throw new Error('Unable to store the session securely on this device.');
      }
    }

    setToken(accessToken);
    setUser(userData ?? { name: 'Student' });
  };

  const logout = async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => undefined);
      }
    } catch (error) {
      console.warn('SecureStore delete failed', error);
    }

    setToken(null);
    setUser(null);
    router.replace('/sign-in');
  };

  const restoreSession = async () => {
    setAuthLoading(true);

    try {
      if (Platform.OS === 'web') {
        setToken(null);
        setUser(null);
        return;
      }

      const isAvailable = await SecureStore.isAvailableAsync().catch(() => false);
      if (!isAvailable) {
        setToken(null);
        setUser(null);
        return;
      }

      const savedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!savedToken) {
        setToken(null);
        setUser(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => undefined);
        setToken(null);
        setUser(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Profile validation failed with status ${response.status}`);
      }

      const payload = await response.json().catch(() => ({}));
      const profile = normalizeUser(payload, undefined);
      setToken(savedToken);
      setUser(profile);
    } catch (error) {
      console.warn('Session restore failed', error);
      setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, authLoading, login, logout, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}
