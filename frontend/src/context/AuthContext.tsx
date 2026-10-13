import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User } from '../types/auth';
import { login as loginService, logout as logoutService, getCurrentUser, refreshToken } from '../services/authService';
import type { LoginRequest } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  role: User['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(accessToken: string, refreshTokenValue: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearTokens();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback(
    (expiresInSeconds: number, currentRefreshToken: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      // Refresh 60 seconds before expiry, minimum 5 seconds
      const refreshInMs = Math.max((expiresInSeconds - 60) * 1000, 5000);
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const tokenResponse = await refreshToken({ refresh_token: currentRefreshToken });
          const storedRefresh = getStoredRefreshToken();
          const newRefreshToken = storedRefresh ?? currentRefreshToken;
          storeTokens(tokenResponse.access_token, newRefreshToken);
          setAccessToken(tokenResponse.access_token);
          if (tokenResponse.expires_in) {
            scheduleTokenRefresh(tokenResponse.expires_in, newRefreshToken);
          }
        } catch {
          clearAuthState();
        }
      }, refreshInMs);
    },
    [clearAuthState]
  );

  // On mount, attempt to restore session using stored access token
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken = getStoredAccessToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await getCurrentUser();
        if (!cancelled) {
          setUser(me);
          setAccessToken(storedToken);
        }
      } catch {
        // Try refresh if access token is expired
        const storedRefresh = getStoredRefreshToken();
        if (storedRefresh) {
          try {
            const tokenResponse = await refreshToken({ refresh_token: storedRefresh });
            if (!cancelled) {
              storeTokens(tokenResponse.access_token, storedRefresh);
              setAccessToken(tokenResponse.access_token);
              const me = await getCurrentUser();
              if (!cancelled) {
                setUser(me);
                if (tokenResponse.expires_in) {
                  scheduleTokenRefresh(tokenResponse.expires_in, storedRefresh);
                }
              }
            }
          } catch {
            if (!cancelled) {
              clearAuthState();
            }
          }
        } else {
          if (!cancelled) {
            clearAuthState();
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [clearAuthState, scheduleTokenRefresh]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
      setIsLoading(true);
      try {
        const tokenResponse = await loginService(credentials);
        // The backend may or may not return a refresh token in a cookie or body.
        // We store whatever refresh token is available; the authService may set it.
        // For the access token we always store it.
        const newRefreshToken = (tokenResponse as Record<string, unknown>)['refresh_token'] as string | undefined ?? '';
        storeTokens(tokenResponse.access_token, newRefreshToken);
        setAccessToken(tokenResponse.access_token);

        const me = await getCurrentUser();
        setUser(me);

        if (tokenResponse.expires_in && newRefreshToken) {
          scheduleTokenRefresh(tokenResponse.expires_in, newRefreshToken);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [scheduleTokenRefresh]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutService();
    } catch {
      // Ignore logout errors — clear local state regardless
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      role: user?.role ?? null,
      isAuthenticated: user !== null && accessToken !== null,
      isLoading,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
