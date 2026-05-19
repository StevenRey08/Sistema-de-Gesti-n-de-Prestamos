'use client';

import { useCallback, useEffect, useState } from 'react';
import { reportesSeguridadApi } from '../../lib/api';
import type { SeguridadDashboard, UsuarioRiesgo } from '../../lib/types';
import { useNotification } from '../ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

export default function ReportesTab() {
  const { notify } = useNotification();
  const [dashboard, setDashboard] = useState<SeguridadDashboard | null>(null);
  const [usuariosRiesgo, setUsuariosRiesgo] = useState<UsuarioRiesgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, riesgo] = await Promise.all([
        reportesSeguridadApi.getDashboard() as Promise<SeguridadDashboard>,
        reportesSeguridadApi.getUsuariosRiesgo() as Promise<UsuarioRiesgo[]>,
      ]);
      setDashboard(dash);
      setUsuariosRiesgo(riesgo);
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar los reportes.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleResetIntentos(usuario_id: string) {
    setResetting(usuario_id);
    try {
      await reportesSeguridadApi.resetIntentos(usuario_id);
      notify('success', 'Intentos fallidos reiniciados');
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al reiniciar intentos');
      notify('error', message, details);
    } finally {
      setResetting(null);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-[var(--text-muted)]">Cargando reportes...</p>;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      <div className="stats-grid">
        <div className="stats-card"><p>Usuarios Totales</p><p>{dashboard.totalUsuarios}</p></div>
        <div className="stats-card"><p>Usuarios Activos</p><p>{dashboard.usuariosActivos}</p></div>
        <div className="stats-card"><p>Usuarios Inactivos</p><p>{dashboard.usuariosInactivos}</p></div>
        <div className="stats-card"><p>Sesiones Activas</p><p>{dashboard.sesionesActivas}</p></div>
        <div className="stats-card"><p>Roles</p><p>{dashboard.totalRoles}</p></div>
        <div className="stats-card"><p>Permisos</p><p>{dashboard.totalPermisos}</p></div>
        <div className="stats-card"><p>Logs Hoy</p><p>{dashboard.logsHoy}</p></div>
        <div className="stats-card"><p>Login Fallidos Hoy</p><p>{dashboard.loginFallidosHoy}</p></div>
        <div className="stats-card"><p>Usuarios Bloqueados</p><p>{dashboard.usuariosBloqueados}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Acciones (Última Semana)</h3>
          {dashboard.topAcciones.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {dashboard.topAcciones.map((item) => (
                <div key={item.accion} className="flex items-center justify-between">
                  <span className="text-sm">{item.accion}</span>
                  <span className="font-mono text-sm font-medium">{item._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <h3 className="text-lg font-semibold mb-4">Usuarios por Rol</h3>
          {dashboard.usuariosPorRol.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {dashboard.usuariosPorRol.map((item) => (
                <div key={item.rol} className="flex items-center justify-between">
                  <span className="text-sm">{item.rol}</span>
                  <span className="font-mono text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="text-lg font-semibold mb-4">Usuarios en Riesgo</h3>
        {usuariosRiesgo.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No hay usuarios en riesgo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-center">Intentos Fallidos</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Nivel Riesgo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosRiesgo.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-[var(--text-muted)]">@{u.usuario}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{u.rol}</td>
                  <td className="px-4 py-3 text-center font-mono">{u.intentos_fallidos}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`status-badge ${u.activo ? 'status-success' : 'status-warning'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      u.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-800' :
                      u.nivel_riesgo === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.nivel_riesgo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleResetIntentos(u.id)} disabled={resetting === u.id}
                      className="text-sm font-medium text-[var(--accent)]">
                      {resetting === u.id ? '...' : 'Resetear intentos'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
