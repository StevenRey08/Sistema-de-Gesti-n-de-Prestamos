'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { movimientosApi, auditoriaApi } from '../../lib/api';
import type { Movimiento, AuditoriaLog } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

interface UnifiedRow {
  id: string;
  fecha: string;
  tipo: string;
  fuente: 'MOVIMIENTO' | 'AUDITORIA';
  articulo: string;
  persona: string;
  modulo: string;
  usuario: string;
  cantidad: number | null;
  ubicaciones: string;
  ip: string;
  descripcion: string;
}

const TIPO_BADGE: Record<string, string> = {
  ENTRADA:  'bg-[var(--surface-2)] text-emerald-500',
  SALIDA:   'bg-[var(--surface-2)] text-red-500',
  TRASLADO: 'bg-[var(--surface-2)] text-orange-500',
  PRESTAMO: 'bg-[var(--surface-2)] text-amber-500',
  DEVUELTO: 'bg-[var(--surface-2)] text-sky-500',
  AJUSTE:   'bg-[var(--surface-2)] text-purple-500',
  LOGIN: 'bg-green-100 text-green-800',
  LOGIN_FALLIDO: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREAR: 'bg-blue-100 text-blue-800',
  ACTUALIZAR: 'bg-yellow-100 text-yellow-800',
  ELIMINAR: 'bg-red-100 text-red-800',
  IMPORTAR_EXCEL: 'bg-purple-100 text-purple-800',
  DEVOLUCION: 'bg-indigo-100 text-indigo-800',
};

function fmt(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function MovimientosPage() {
  const { notify } = useNotification();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [movs, aud] = await Promise.all([
        movimientosApi.getAll() as Promise<Movimiento[]>,
        auditoriaApi.getAll({}) as Promise<AuditoriaLog[]>,
      ]);
      setMovimientos(movs);
      setLogs(aud);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar datos');
      notify('error', message, details);
    } finally { setCargando(false); }
  }, [notify]);

  useEffect(() => { cargar(); }, [cargar]);

  const unified = useMemo<UnifiedRow[]>(() => {
    const rows: UnifiedRow[] = [];

    for (const m of movimientos) {
      rows.push({
        id: `mov-${m.id}`,
        fecha: m.fecha || '',
        tipo: m.tipo,
        fuente: 'MOVIMIENTO',
        articulo: m.inventario?.nombre || '—',
        persona: m.persona ? `${m.persona.nombres} ${m.persona.apellidos}` : '—',
        modulo: '—',
        usuario: m.usuario ? `${m.usuario.nombre} ${m.usuario.apellido} (${m.usuario.usuario})` : '—',
        cantidad: m.cantidad,
        ubicaciones: m.ubicacion_origen
          ? `${m.ubicacion_origen.nombre} → ${m.ubicacion_destino?.nombre || '—'}`
          : m.ubicacion_destino?.nombre || '—',
        ip: '—',
        descripcion: m.observaciones || '—',
      });
    }

    for (const a of logs) {
      rows.push({
        id: `aud-${a.id}`,
        fecha: a.fecha,
        tipo: a.accion,
        fuente: 'AUDITORIA',
        articulo: '—',
        persona: '—',
        modulo: a.modulo,
        usuario: a.usuario ? `${a.usuario.nombre} ${a.usuario.apellido} (@${a.usuario.usuario})` : 'Sistema',
        cantidad: null,
        ubicaciones: '—',
        ip: a.ip || '—',
        descripcion: a.descripcion || '—',
      });
    }

    rows.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return rows;
  }, [movimientos, logs]);

  const filtered = useMemo(() => {
    let items = unified;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.tipo.toLowerCase().includes(q) ||
        r.articulo.toLowerCase().includes(q) ||
        r.persona.toLowerCase().includes(q) ||
        r.usuario.toLowerCase().includes(q) ||
        r.modulo.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        r.ip.toLowerCase().includes(q)
      );
    }
    if (filtroTipo !== 'todos') {
      items = items.filter(r => r.tipo === filtroTipo);
    }
    return items;
  }, [unified, search, filtroTipo]);

  const tiposUnicos = useMemo(() => {
    const s = new Set<string>();
    unified.forEach(r => s.add(r.tipo));
    return ['todos', ...Array.from(s).sort()];
  }, [unified]);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Movimientos y Auditoría</h1>
          <p className="page-subtitle">{unified.length} registros en total</p>
        </div>
        <button onClick={cargar} className="soft-btn-secondary">↻ Actualizar</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="search" placeholder="Buscar en todos los registros..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="soft-input min-w-0 flex-1 text-xs" />
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="soft-select w-auto text-xs">
          {tiposUnicos.map(t => (
            <option key={t} value={t}>{t === 'todos' ? 'Todos los tipos' : t}</option>
          ))}
        </select>
      </div>

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Artículo / Módulo</th>
                  <th className="px-4 py-3 text-left">Persona</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-muted)]">{fmt(r.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${TIPO_BADGE[r.tipo] || 'bg-gray-100 text-gray-800'}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                      {r.articulo !== '—' ? r.articulo : <span className="text-[var(--text-muted)]">{r.modulo}</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-main)]">{r.persona}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{r.usuario}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {r.fuente === 'MOVIMIENTO' ? (
                        <div className="flex flex-col gap-0.5">
                          {r.cantidad !== null && <span>×{r.cantidad}</span>}
                          {r.ubicaciones !== '—' && <span>{r.ubicaciones}</span>}
                          <span className="text-[10px] text-[var(--text-muted)]">{r.descripcion}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span>{r.descripcion}</span>
                          {r.ip !== '—' && <span className="text-[10px] font-mono text-[var(--text-muted)]">IP: {r.ip}</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}