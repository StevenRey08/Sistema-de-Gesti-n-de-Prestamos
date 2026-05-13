'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AUTH_STORAGE_KEY, authenticate, toSessionUser, type SessionUser, updateStoredCurrentUser } from '../../lib/auth';
import api from '../../lib/api';

interface AuthContextValue {
  user: SessionUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  updateCurrentUser: (user: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = typeof window !== 'undefined'
          ? window.localStorage.getItem(AUTH_STORAGE_KEY)
          : null;
        if (stored) {
          setUser(JSON.parse(stored) as SessionUser);
        }
        const res = await api.get('/auth/me') as { status: string; usuario: Record<string, unknown> };
        if (res.status === 'ok' && res.usuario) {
          const sessionUser = toSessionUser(res.usuario);
          setUser(sessionUser);
          try {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
          } catch { /* ignorar */ }
        }
      } catch {
        try { window.localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignorar */ }
        setUser(null);
      } finally {
        setHydrated(true);
      }
    };
    restore();
  }, []);

  async function signIn(email: string, password: string) {
    const sessionUser = await authenticate(email, password);
    if (!sessionUser) {
      throw new Error('Credenciales inválidas. Verifica tu usuario y contraseña.');
    }

    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    }
    setUser(sessionUser);
    return sessionUser;
  }

  async function signOut() {
    try {
      await api.post('/auth/logout', {});
    } catch {
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      if (typeof window.localStorage.removeItem === 'function') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem('token');
      }
    }
    setUser(null);
  }

  function updateCurrentUser(nextUser: SessionUser) {
    updateStoredCurrentUser(nextUser);
    setUser(nextUser);
  }

  return (
    <AuthContext.Provider value={{ user, hydrated, signIn, signOut, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
