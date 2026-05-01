'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthProvider, useAuth } from '../auth/AuthProvider';

function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    if (!hydrated) return;

    if (!user && !isLoginRoute) {
      router.replace('/login');
      return;
    }

    if (user && isLoginRoute) {
      router.replace('/');
    }
  }, [hydrated, isLoginRoute, router, user]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-soft)]">
        <div className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-white px-6 py-4 shadow-[var(--shadow-soft)]">
          <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent-strong)]" />
          <p className="text-sm font-medium text-[var(--text-main)]">Preparando el sistema...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoginRoute) return null;
  if (user && isLoginRoute) return null;

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-soft)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppFrame>{children}</AppFrame>
    </AuthProvider>
  );
}
