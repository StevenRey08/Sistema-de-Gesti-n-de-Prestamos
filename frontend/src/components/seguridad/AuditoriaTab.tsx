'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { auditoriaApi } from '../../lib/api';
import type { AuditoriaLog } from '../../lib/types';
import { useNotification } from '../ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

const ACCION_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGIN_FALLIDO: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREAR: 'bg-blue-100 text-blue-800',
  ACTUALIZAR: 'bg-yellow-100 text-yellow-800',
  ELIMINAR: 'bg-red-100 text-red-800',
  IMPORTAR_EXCEL: 'bg-purple-100 text-purple-800',
  DEVOLUCION: 'bg-indigo-100 text-indigo-800',
};

export default function AuditoriaTab() {
  const { notify } = useNotification();
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [limpiando, setLimpiando] = useState(false);
  const [confirmClean, setConfirmClean] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filtroAccion) params.accion = filtroAccion;
      if (filtroModulo) params.modulo = filtroModulo;
      const data = await auditoriaApi.getAll(params) as AuditoriaLog[];
      setLogs(data);
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar la auditoría.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [search, filtroAccion, filtroModulo, notify]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const modulosUnicos = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(log => set.add(log.modulo));
    return Array.from(set).sort();
  }, [logs]);

  const accionesUnicas = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(log => set.add(log.accion));
    return Array.from(set).sort();
  }, [logs]);

  async function handleCleanLogs() {
    setLimpiando(true);
    try {
      const result = await auditoriaApi.cleanOldLogs({ dias: 90 }) as { count: number };
      notify('success', `Se eliminaron ${result.count} registros antiguos`);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al limpiar logs');
      notify('error', message, details);
    } finally {
      setLimpiando(false);
      setConfirmClean(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-DO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 flex-wrap">
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en auditoría..." className="soft-input max-w-xs"
          />
          <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)} className="soft-select">
            <option value="">Todas las acciones</option>
            {accionesUnicas.map(accion => <option key={accion} value={accion}>{accion}</option>)}
          </select>
          <select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)} className="soft-select">
            <option value="">Todos los módulos</option>
            {modulosUnicos.map(modulo => <option key={modulo} value={modulo}>{modulo}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCleanLogs} disabled={limpiando} className="soft-btn-secondary text-sm">
            {limpiando ? 'Limpiando...' : 'Limpiar logs antiguos (>90 días)'}
          </button>
        </div>
      </div>

      <div className="table-shell">
        {loading ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando logs...</p>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay logs para mostrar.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Módulo</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-muted)]">
                    {formatDate(log.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    {log.usuario ? (
                      <div>
                        <p className="font-medium text-[var(--text-main)]">{log.usuario.nombre} {log.usuario.apellido}</p>
                        <p className="text-xs text-[var(--text-muted)]">@{log.usuario.usuario}</p>
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">Sistema</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ACCION_COLORS[log.accion] || 'bg-gray-100 text-gray-800'}`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{log.modulo}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] max-w-xs truncate">{log.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
