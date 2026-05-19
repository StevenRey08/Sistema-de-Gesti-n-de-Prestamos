'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import type { PersonaHistorico } from '../../../lib/types';
import { useNotification } from '../../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../../lib/errors';

export default function HistoricoPage() {
  const { notify } = useNotification();
  const [historico, setHistorico] = useState<PersonaHistorico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState('');

  const buildUrl = useCallback((base: string, params: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return `${base}${qs ? '?' + qs : ''}`;
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const url = buildUrl('/personas/historico', { search });
      setHistorico(await api.get(url) as PersonaHistorico[]);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    } finally { setCargando(false); }
  }, [notify, search, buildUrl]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Histórico de Personas</h1>
          <p className="page-subtitle">{historico.length} registros</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3 surface-card rounded-t-2xl">
        <input type="search" placeholder="Buscar por nombre, apellido o matrícula..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="soft-input min-w-0 flex-1 text-xs" />
      </div>

      <div className="surface-card overflow-hidden rounded-b-2xl">
        <div className="overflow-x-auto" style={{ maxHeight: '520px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Matrícula</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Curso</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Fecha Salida</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dado de baja por</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">Cargando...</td></tr>
              ) : historico.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">Sin registros históricos.</td></tr>
              ) : historico.map(h => (
                <tr key={h.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[var(--text-main)]">{h.matricula || '—'}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{h.nombres} {h.apellidos}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{h.curso || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {h.fecha_baja ? new Date(h.fecha_baja).toLocaleDateString('es-DO', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {h.usuario_baja ? `${h.usuario_baja.nombre} ${h.usuario_baja.apellido}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
