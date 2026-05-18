'use client';
import { useState, useEffect, useCallback } from 'react';
import api, { BACKEND_ORIGIN } from '../../lib/api';
import type { ItemInventario } from '../../lib/types';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

interface ReporteItem extends ItemInventario {
  estado?: string;
  total_prestamos?: number;
  total_prestado?: number;
  persona?: { nombres: string; apellidos: string };
  instructor?: { nombres: string; apellidos: string };
  usuario?: { nombre: string; apellido: string };
  fecha_prestamo?: string;
  fecha_devolucion?: string;
}

function fmt(fecha: string | null | undefined) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TIPOS = [
  { id: 'bajo-stock', label: 'Bajo Stock' },
  { id: 'mas-prestados', label: 'Más Prestados' },
  { id: 'menos-prestados', label: 'Menos Prestados' },
  { id: 'prestamos-vencidos', label: 'Préstamos Vencidos' },
];

export default function ReportesPage() {
  const { notify } = useNotification();
  const [tipo, setTipo] = useState('bajo-stock');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [data, setData] = useState<ReporteItem[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    const fechaValida = (s: string) => s && !isNaN(new Date(s).getTime());
    if (fechaInicio && !fechaValida(fechaInicio)) { setData([]); return; }
    if (fechaFin && !fechaValida(fechaFin)) { setData([]); return; }

    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fechaInicio', fechaInicio);
      if (fechaFin) params.set('fechaFin', fechaFin);
      const qs = params.toString();
      const res = await api.get(`/reportes/${tipo}${qs ? `?${qs}` : ''}`) as ReporteItem[];
      setData(res);
    } catch (e: unknown) {
      const { message } = notifyErrorPayload(e, 'Error al cargar reporte');
      notify('error', message);
    } finally {
      setCargando(false);
    }
  }, [tipo, fechaInicio, fechaFin, notify]);

  useEffect(() => { cargar(); }, [cargar]);

  function previsualizarPDF() {
    const params = new URLSearchParams({ tipo });
    if (fechaInicio) params.set('fechaInicio', fechaInicio);
    if (fechaFin) params.set('fechaFin', fechaFin);

    const token = (() => {
      try {
        const s = localStorage.getItem('sgp-session');
        if (s && s !== 'undefined' && s !== 'null') return JSON.parse(s)?.token;
        return localStorage.getItem('token') || '';
      } catch { return ''; }
    })();

    const url = `${BACKEND_ORIGIN}/api/reportes/pdf?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ mensaje: 'Error al generar PDF' }));
          throw new Error(err.mensaje || 'Error al generar PDF');
        }
        return r.blob();
      })
      .then(blob => {
        window.open(URL.createObjectURL(blob), '_blank');
      })
      .catch(e => notify('error', e.message));
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Indicadores y estadísticas del sistema</p>
        </div>
        <button onClick={previsualizarPDF} className="soft-btn-primary">
          Ver PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Tipo de reporte</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="soft-input">
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Fecha inicio</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="soft-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Fecha fin</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="soft-input" />
        </div>
      </div>

      <div className="table-shell mt-6">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : data.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Sin resultados para este reporte.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                {tipo === 'bajo-stock' && <th className="px-4 py-3 text-left">Categoría</th>}
                {tipo === 'bajo-stock' && <th className="px-4 py-3 text-left">Disponible</th>}
                {tipo === 'bajo-stock' && <th className="px-4 py-3 text-left">Estado</th>}
                {tipo === 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Estudiante</th>}
                {tipo === 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Instructor</th>}
                {tipo === 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Fecha Préstamo</th>}
                {tipo === 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Fecha Devolución</th>}
                {tipo === 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Registrado por</th>}
                {tipo !== 'bajo-stock' && tipo !== 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Veces prestado</th>}
                {tipo !== 'bajo-stock' && tipo !== 'prestamos-vencidos' && <th className="px-4 py-3 text-left">Total unidades</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={(item as unknown as { id: string }).id || String(index)} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-[var(--text-muted)]">{item.codigo}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{item.nombre}</td>
                  {tipo === 'bajo-stock' && <td className="px-4 py-3">{item.categoria?.nombre || '—'}</td>}
                  {tipo === 'bajo-stock' && (
                    <td className="px-4 py-3">
                      <span className={`font-bold ${item.cantidad_disponible <= 0 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                        {item.cantidad_disponible}
                      </span>
                    </td>
                  )}
                  {tipo === 'bajo-stock' && <td className="px-4 py-3">{item.estado || '—'}</td>}
                  {tipo === 'prestamos-vencidos' && (
                    <td className="px-4 py-3 text-[var(--text-main)]">
                      {item.persona ? `${item.persona.nombres} ${item.persona.apellidos}` : '—'}
                    </td>
                  )}
                  {tipo === 'prestamos-vencidos' && (
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {item.instructor ? `${item.instructor.nombres} ${item.instructor.apellidos}` : '—'}
                    </td>
                  )}
                  {tipo === 'prestamos-vencidos' && (
                    <td className="px-4 py-3 text-[var(--text-muted)]">{fmt(item.fecha_prestamo)}</td>
                  )}
                  {tipo === 'prestamos-vencidos' && (
                    <td className="px-4 py-3 font-bold text-red-500">{fmt(item.fecha_devolucion)}</td>
                  )}
                  {tipo === 'prestamos-vencidos' && (
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '—'}
                    </td>
                  )}
                  {tipo !== 'bajo-stock' && tipo !== 'prestamos-vencidos' && <td className="px-4 py-3 font-bold">{item.total_prestamos}</td>}
                  {tipo !== 'bajo-stock' && tipo !== 'prestamos-vencidos' && <td className="px-4 py-3">{item.total_prestado}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
