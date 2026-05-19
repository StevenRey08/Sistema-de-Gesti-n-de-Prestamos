'use client';

import { useCallback, useEffect, useState } from 'react';
import { sesionesApi } from '../../lib/api';
import type { Sesion } from '../../lib/types';
import { useNotification } from '../ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

export default function SesionesTab() {
  const { notify } = useNotification();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [revocando, setRevocando] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sesionesApi.getAll() as Sesion[];
      setSesiones(data);
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar las sesiones.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRevoke(id: string) {
    setRevocando(id);
    try {
      await sesionesApi.revoke(id);
      notify('success', 'Sesión revocada correctamente');
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al revocar sesión');
      notify('error', message, details);
    } finally {
      setRevocando(null);
    }
  }

  async function handleRevokeAll(usuario_id: string) {
    try {
      await sesionesApi.revokeAllByUser(usuario_id);
      notify('success', 'Todas las sesiones del usuario han sido revocadas');
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al revocar sesiones');
      notify('error', message, details);
    }
  }

  async function handleCleanExpired() {
    try {
      const result = await sesionesApi.cleanExpired() as { count: number };
      notify('success', `Se limpiaron ${result.count} sesiones expiradas`);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al limpiar sesiones');
      notify('error', message, details);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-DO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function getTimeSince(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `Hace ${diffHours}h`;
    return `Hace ${diffMins}m`;
  }

  return (
    <section className="space-y-6">
      <div className="flex justify-end gap-2">
        <button onClick={handleCleanExpired} className="soft-btn-secondary text-sm">
          Limpiar sesiones expiradas
        </button>
      </div>

      <div className="table-shell">
        {loading ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando sesiones...</p>
        ) : sesiones.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay sesiones activas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">Inicio de sesión</th>
                <th className="px-4 py-3 text-left">Duración</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((sesion) => (
                <tr key={sesion.id}>
                  <td className="px-4 py-3">
                    {sesion.usuario ? (
                      <div>
                        <p className="font-medium text-[var(--text-main)]">{sesion.usuario.nombre} {sesion.usuario.apellido}</p>
                        <p className="text-xs text-[var(--text-muted)]">@{sesion.usuario.usuario}</p>
                        {sesion.usuario.rol && (
                          <span className="inline-flex mt-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent-strong)]">
                            {sesion.usuario.rol.nombre_rol}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">Usuario desconocido</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{sesion.ip || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(sesion.fecha_login)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{getTimeSince(sesion.fecha_login)}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => handleRevoke(sesion.id)} disabled={revocando === sesion.id}
                      className="text-sm font-medium text-[var(--danger)] disabled:opacity-50">
                      {revocando === sesion.id ? 'Revocando...' : 'Revocar'}
                    </button>
                    {sesion.usuario && (
                      <button onClick={() => sesion.usuario && handleRevokeAll(sesion.usuario.id)}
                        className="text-sm font-medium text-[var(--accent-strong)]">
                        Revocar todas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
