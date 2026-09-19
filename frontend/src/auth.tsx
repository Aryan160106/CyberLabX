import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet } from "react-router-dom";
import * as api from "./api";

interface AuthContextValue {
  user: api.User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => api.tokenStore.get() !== null);

  // On page load: if a token is stored, ask the backend who it belongs to.
  useEffect(() => {
    if (!api.tokenStore.get()) return;
    api
      .fetchMe()
      .then(setUser)
      .catch(() => api.tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Token expired or rejected while using the app -> back to logged-out state.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(api.UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.tokenStore.set(res.access_token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await api.signup(email, password, displayName);
    api.tokenStore.set(res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    api.tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Route guard: only logged-in users get through to the nested routes. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center font-mono text-sm text-dim">
        loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}