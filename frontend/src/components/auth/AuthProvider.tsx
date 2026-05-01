'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AUTH_STORAGE_KEY, authenticate, type SessionUser, updateStoredCurrentUser } from '../../lib/auth';

interface AuthContextValue {
  user: SessionUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signOut: () => void;
  updateCurrentUser: (user: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as SessionUser);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  async function signIn(email: string, password: string) {
    const sessionUser = authenticate(email, password);
    if (!sessionUser) {
      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }

  function signOut() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
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
