import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const tokenKey = 'home-store-session-token';

const tokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

const validToken = (token: string | null) => {
  const expiry = token ? tokenExpiry(token) : null;
  return Boolean(token && expiry && expiry > Date.now());
};

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  signIn: (passphrase: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(tokenKey);
    if (validToken(stored)) return stored;
    if (stored) localStorage.removeItem(tokenKey);
    return null;
  });

  const signIn = useCallback(async (passphrase: string) => {
    const response = await fetch(
      `${(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')}/session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      },
    );
    const body = (await response.json().catch(() => ({}))) as {
      token?: string;
      error?: { message?: string };
    };
    if (!response.ok || !body.token)
      throw new Error(body.error?.message ?? 'Unable to unlock Home Store.');
    localStorage.setItem(tokenKey, body.token);
    setToken(body.token);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, isAuthenticated: validToken(token), signIn, signOut }),
    [signIn, signOut, token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
};
