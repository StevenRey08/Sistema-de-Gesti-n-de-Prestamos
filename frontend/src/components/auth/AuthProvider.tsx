'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AUTH_STORAGE_KEY, authenticate, type SessionUser, updateStoredCurrentUser } from '../../lib/auth';
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

  // Al cargar, intentar restaurar sesión desde la cookie (httpOnly)
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored) as SessionUser);
        } else {
          // Intentar restaurar desde cookie via /api/auth/me
          const res = await api.get('/auth/me') as { status: string; usuario: SessionUser };
          if (res.status === 'ok' && res.usuario) {
            setUser(res.usuario);
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.usuario));
          }
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
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

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }

  async function signOut() {
    try {
      await api.post('/auth/logout', {});
    } catch {
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem('token');
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
