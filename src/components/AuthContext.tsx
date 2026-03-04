import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { AuthUser } from '../types';
import {
  DesktopApiError,
  getWebAppBaseUrl,
  getWebSession,
  loginWithWebApp,
  logoutFromWebApp
} from '../lib/web-api';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  webAppBaseUrl: string | null;
  login: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

type StoredSession = {
  user: AuthUser;
  token: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_STORAGE_KEY = 'aspire-desktop-session';

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function persistStoredSession(session: StoredSession | null): void {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write failures in constrained environments.
  }
}

function toAuthUser(raw: {
  username: string;
  role?: string;
  metadata?: Record<string, unknown>;
}): AuthUser {
  const metadata = raw.metadata ?? {};
  const displayName =
    typeof metadata.displayName === 'string'
      ? metadata.displayName
      : typeof metadata.fullName === 'string'
      ? metadata.fullName
      : raw.username;

  return {
    username: raw.username,
    role: raw.role,
    metadata,
    displayName
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webAppBaseUrl, setWebAppBaseUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);
      const stored = readStoredSession();

      if (stored && mounted) {
        setUser(stored.user);
        setToken(stored.token);
      }

      try {
        const baseUrl = await getWebAppBaseUrl();
        if (mounted) {
          setWebAppBaseUrl(baseUrl);
        }
      } catch {
        if (mounted) {
          setWebAppBaseUrl(null);
        }
      }

      try {
        const session = await getWebSession();
        if (!mounted) {
          return;
        }
        const nextUser = toAuthUser(session.user);
        const nextToken = stored?.token ?? 'desktop-session';
        setUser(nextUser);
        setToken(nextToken);
        setError(null);
        persistStoredSession({ user: nextUser, token: nextToken });
      } catch (err) {
        if (!mounted) {
          return;
        }

        const isUnauthorized = err instanceof DesktopApiError && err.status === 401;
        if (isUnauthorized || !stored) {
          setUser(null);
          setToken(null);
          persistStoredSession(null);
        }

        if (!(isUnauthorized && !stored)) {
          setError(err instanceof Error ? err.message : 'Session sync failed.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginWithWebApp({ username, password });
      const nextUser = toAuthUser(response.user);
      const nextToken = response.token || 'desktop-session';

      setUser(nextUser);
      setToken(nextToken);
      persistStoredSession({ user: nextUser, token: nextToken });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to authenticate.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutFromWebApp();
    } catch {
      // Even on backend errors, clear local session.
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      persistStoredSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      webAppBaseUrl,
      login,
      logout
    }),
    [user, token, loading, error, webAppBaseUrl, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
