'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, fetchMe, getAccessToken, getCachedUser } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  reload: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCachedUser());
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !getCachedUser() && !!getAccessToken();
  });

  async function reload() {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getAccessToken() && !getCachedUser()) reload();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, reload }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}