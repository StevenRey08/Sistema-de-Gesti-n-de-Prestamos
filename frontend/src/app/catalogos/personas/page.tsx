'use client';
import { useState, useEffect, useCallback } from 'react';
import { personasApi } from '../../../lib/api';
import api from '../../../lib/api';
import PersonaForm from '../../../components/catalogos/PersonaForm';
import type { Persona, PersonaPayload } from '../../../lib/types';
import { useNotification } from '../../../components/ui/NotificationContext';
import { usePermiso } from '../../../lib/permissions';
import { notifyErrorPayload } from '../../../lib/errors';

const NIVELES = ['4to', '5to', '6to'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function parseCurso(curso: string | null | undefined) {
  if (!curso) return { nivel: '', seccion: '' };
  const p = curso.trim().split(' ');
  return {
    nivel: p[0] || '',
    seccion: (p[1] || ''),
  };
}

export default function PersonasPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('PERSONAS');

  const [estudiantes, setEstudiantes] = useState<Persona[]>([]);
  const [docentes, setDocentes] = useState<Persona[]>([]);
  const [cargandoEst, setCargandoEst] = useState(true);
  const [cargandoDoc, setCargandoDoc] = useState(true);

  const [estSearch, setEstSearch] = useState('');
  const [estCurso, setEstCurso] = useState('');
  const [estSeccion, setEstSeccion] = useState('');

  const [docSearch, setDocSearch] = useState('');
  const [docTipo, setDocTipo] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);
  const [eliminando, setElim] = useState<string | null>(null);
  const [eliminandoTodo, setEliminandoTodo] = useState(false);
  const [confirmarEliminarTodo, setConfirmarEliminarTodo] = useState(false);
  const [panelActivo, setPanelActivo] = useState<'estudiantes' | 'docentes'>('estudiantes');

  const buildUrl = useCallback((base: string, params: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return `${base}${qs ? '?' + qs : ''}`;
  }, []);

  const cargarEstudiantes = useCallback(async () => {
    setCargandoEst(true);
    try {
      const url = buildUrl('/personas', {
        tipo: 'ESTUDIANTE',
        search: estSearch,
        curso: estCurso,
        seccion: estSeccion,
      });
      setEstudiantes(await api.get(url) as Persona[]);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    } finally { setCargandoEst(false); }
  }, [notify, estSearch, estCurso, estSeccion, buildUrl]);

  const cargarDocentes = useCallback(async () => {
    setCargandoDoc(true);
    try {
      const url = buildUrl('/personas', {
        search: docSearch,
        tipo: docTipo,
      });
      const todas = await api.get(url) as Persona[];
      setDocentes(todas.filter(p => p.tipo?.toUpperCase() !== 'ESTUDIANTE'));
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    } finally { setCargandoDoc(false); }
  }, [notify, docSearch, docTipo, buildUrl]);

  useEffect(() => { cargarEstudiantes(); }, [cargarEstudiantes]);
  useEffect(() => { cargarDocentes(); }, [cargarDocentes]);

  async function handleGuardar(form: PersonaPayload) {
    if (editando) await personasApi.update(editando.id, form);
    else await personasApi.create(form);
    setShowForm(false); setEditando(null);
    cargarEstudiantes(); cargarDocentes();
  }

  async function handleDarDeBaja() {
    try {
      if (eliminando) {
        await api.patch(`/personas/${eliminando}/debaja`, {});
        notify('success', 'Persona dada de baja correctamente');
      }
      setElim(null);
      cargarEstudiantes(); cargarDocentes();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    }
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('http://localhost:4000/api/personas/import-excel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('sgp-session') || '{}').token || ''}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) notify('success', data.mensaje);
      else notify('error', data.mensaje);
      cargarEstudiantes(); cargarDocentes();
    } catch (err: unknown) {
      const { message } = notifyErrorPayload(err, 'Error al importar');
      notify('error', message);
    }
    e.target.value = '';
  }

  async function handleEliminarTodosEstudiantes() {
    setConfirmarEliminarTodo(true);
  }

  async function ejecutarEliminarTodos() {
    setConfirmarEliminarTodo(false);
    setEliminandoTodo(true);
    try {
      const res = await api.patch('/personas/estudiantes/debaja', {}) as { message: string; pasadosHistorico: number; eliminados: number; omitidos: number };
      notify('success', res.message);
      cargarEstudiantes();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    } finally { setEliminandoTodo(false); }
  }

  async function handleDownloadTemplate() {
    try {
      const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('sgp-session') || '{}').token || '';
      const res = await fetch('http://localhost:4000/api/personas/download-template', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { notify('error', 'Error al descargar plantilla'); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'plantilla_personas.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      notify('error', 'Error al descargar plantilla');
    }
  }

  function openForm(panel: 'estudiantes' | 'docentes', p: Persona | null) {
    setPanelActivo(panel);
    setEditando(p);
    setShowForm(true);
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Personas</h1>
          <p className="page-subtitle">
            {estudiantes.length} estudiantes &middot; {docentes.length} docentes y personal
          </p>
        </div>
        <div className="flex gap-2">
          {puedeIngresar && (
            <button onClick={handleDownloadTemplate} className="soft-btn-secondary text-xs">
              Descargar Plantilla Excel
            </button>
          )}
          {!puedeIngresar && puedeActualizar && (
            <button onClick={handleDownloadTemplate} className="soft-btn-secondary text-xs">
              Descargar Plantilla Excel
            </button>
          )}
          {puedeIngresar && (
            <label className="soft-btn-secondary text-xs cursor-pointer">
              Importar Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            </label>
          )}
          {puedeIngresar && (
            <button onClick={() => { setEditando(null); setShowForm(true); }} className="soft-btn-primary">
              + Nueva Persona
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ========== PANEL ESTUDIANTES ========== */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Estudiantes</h2>
              <p className="text-xs text-[var(--text-muted)]">{estudiantes.length} registros</p>
            </div>
            {puedeEliminar && (
              <button onClick={handleEliminarTodosEstudiantes} disabled={eliminandoTodo}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                {eliminandoTodo ? 'Dando de baja...' : 'Dar de baja todos'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
            <input type="search" placeholder="Buscar por nombre o matrícula..."
              value={estSearch} onChange={e => setEstSearch(e.target.value)}
              className="soft-input min-w-0 flex-1 text-xs" />
            <select value={estCurso} onChange={e => setEstCurso(e.target.value)}
              className="soft-select w-auto text-xs">
              <option value="">Todos los cursos</option>
              {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={estSeccion} onChange={e => setEstSeccion(e.target.value)}
              className="soft-select w-auto text-xs">
              <option value="">Todas las secciones</option>
              {SECCIONES.map(s => <option key={s} value={s}>Sección {s}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto" style={{ maxHeight: '420px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Matrícula</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nombre</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Curso</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargandoEst ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">Cargando...</td></tr>
                ) : estudiantes.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">Sin estudiantes registrados.</td></tr>
                ) : estudiantes.map(p => {
                  const { nivel, seccion } = parseCurso(p.curso);
                  return (
                    <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--text-main)]">{p.matricula || '—'}</span>
                          {(p.prestamosActivos ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                              {p.prestamosActivos} préstamo(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text-main)]">{p.nombres} {p.apellidos}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {nivel && seccion ? `${nivel} - ${seccion}` : (p.curso || '—')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {puedeActualizar && (
                          <button onClick={() => openForm('estudiantes', p)}
                            className="text-xs font-medium text-[var(--accent-strong)] hover:underline">Editar</button>
                        )}
                        {puedeEliminar && (
                          <button onClick={() => setElim(p.id)}
                            className="text-xs font-medium text-red-500 hover:underline">Dar de baja</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {puedeIngresar && (
            <div className="border-t border-[var(--border)] px-5 py-3">
              <button onClick={() => openForm('estudiantes', null)}
                className="text-xs font-medium text-[var(--accent-strong)] hover:underline">+ Agregar estudiante</button>
            </div>
          )}
        </div>

        {/* ========== PANEL DOCENTES ========== */}
        <div className="surface-card overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Docentes y Personal</h2>
            <p className="text-xs text-[var(--text-muted)]">{docentes.length} registros</p>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
            <input type="search" placeholder="Buscar por nombre o DNI..."
              value={docSearch} onChange={e => setDocSearch(e.target.value)}
              className="soft-input min-w-0 flex-1 text-xs" />
            <select value={docTipo} onChange={e => setDocTipo(e.target.value)}
              className="soft-select w-auto text-xs">
              <option value="">Todos</option>
              <option value="PROFESOR">Profesores</option>
              <option value="TECNICO">Técnicos</option>
              <option value="ADMINISTRATIVO">Administrativos</option>
            </select>
          </div>

          <div className="overflow-x-auto" style={{ maxHeight: '420px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">DNI</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nombre</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tipo</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargandoDoc ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">Cargando...</td></tr>
                ) : docentes.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">Sin docentes o personal registrados.</td></tr>
                ) : docentes.map(p => (
                  <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[var(--text-main)]">{p.matricula || '—'}</span>
                        {(p.prestamosActivos ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 border border-amber-200">
                            {p.prestamosActivos} préstamo(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">{p.nombres} {p.apellidos}</td>
                    <td className="px-4 py-3">
                      <span className="status-badge status-info text-[10px]">{p.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {puedeActualizar && (
                        <button onClick={() => openForm('docentes', p)}
                          className="text-xs font-medium text-[var(--accent-strong)] hover:underline">Editar</button>
                      )}
                      {puedeEliminar && (
                        <button onClick={() => setElim(p.id)}
                          className="text-xs font-medium text-red-500 hover:underline">Dar de baja</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {puedeIngresar && (
            <div className="border-t border-[var(--border)] px-5 py-3">
              <button onClick={() => openForm('docentes', null)}
                className="text-xs font-medium text-[var(--accent-strong)] hover:underline">+ Agregar docente / personal</button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6">
            <PersonaForm persona={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }}
              defaultTipo={panelActivo === 'estudiantes' ? 'ESTUDIANTE' : 'PROFESOR'} />
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow-2xl max-w-sm w-full space-y-4">
            <p className="font-medium text-[var(--text-main)]">¿Dar de baja a esta persona?</p>
            <p className="text-sm text-[var(--text-muted)]">Se desactivará del sistema pero no se eliminará. No se puede dar de baja si tiene préstamos pendientes.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setElim(null)}
                className="soft-btn-secondary px-4 py-2 text-xs">Cancelar</button>
              <button onClick={handleDarDeBaja}
                className="rounded-full bg-red-600 px-6 py-2 text-xs font-medium text-white hover:bg-red-700">Sí, dar de baja</button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminarTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-white p-6 text-center shadow-2xl max-w-sm w-full space-y-4">
            <p className="font-medium text-[var(--text-main)]">¿Dar de baja a todos los estudiantes?</p>
            <p className="text-sm text-[var(--text-muted)]">Estudiantes de 6to sin préstamos → pasan a histórico. Estudiantes de 4to/5to sin préstamos → se eliminan del sistema. Los que tengan préstamos activos se quedan.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmarEliminarTodo(false)}
                className="soft-btn-secondary px-4 py-2 text-xs">Cancelar</button>
              <button onClick={ejecutarEliminarTodos}
                className="rounded-full bg-red-600 px-6 py-2 text-xs font-medium text-white hover:bg-red-700">Sí, dar de baja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
