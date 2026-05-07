'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  details?: string[];
}

interface NotificationContextValue {
  notify: (type: NotificationType, message: string, details?: string[]) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((type: NotificationType, message: string, details?: string[]) => {
    if (type === 'error') return;
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, details }]);

    // Auto-remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex flex-col rounded-2xl border p-4 shadow-2xl transition-all animate-in slide-in-from-right-10 duration-300 ${
              n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              n.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <span>
                  {n.type === 'success' && '✓'}
                  {n.type === 'error' && '✕'}
                  {n.type === 'warning' && '⚠'}
                  {n.type === 'info' && 'ℹ'}
                </span>
                <p className="text-sm">{n.message}</p>
              </div>
              <button 
                onClick={() => removeNotification(n.id)}
                className="text-lg opacity-50 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
            {n.details && n.details.length > 0 && (
              <ul className="mt-2 ml-6 list-disc text-xs opacity-80 space-y-1">
                {n.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
}
