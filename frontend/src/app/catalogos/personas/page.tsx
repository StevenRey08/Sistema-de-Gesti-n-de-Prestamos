'use client';
import { useState, useEffect, useCallback } from 'react';
import { personasApi } from '../../../lib/api';
import api from '../../../lib/api';
import PersonaForm from '../../../components/catalogos/PersonaForm';
import type { Persona, PersonaPayload } from '../../../lib/types';
import { useNotification } from '../../../components/ui/NotificationContext';
import { usePermiso } from '../../../lib/permissions';
import { notifyErrorPayload } from '../../../lib/errors';

export default function PersonasPage() {
  const { notify } = useNotification();
  const { puedeIngresar, puedeActualizar, puedeEliminar } = usePermiso('PERSONAS');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);
  const [eliminando, setElim] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tipoFiltro) params.set('tipo', tipoFiltro);
      const url = `/personas${params.toString() ? '?' + params.toString() : ''}`;
      setPersonas(await api.get(url) as Persona[]);
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al cargar personas');
      notify('error', message, details);
    } finally { setCargando(false); }
  }, [notify, search, tipoFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: PersonaPayload) {
    if (editando) await personasApi.update(editando.id, form);
    else await personasApi.create(form);
    setShowForm(false); setEditando(null); cargar();
  }

  async function handleEliminar() {
    try {
      if (eliminando) await personasApi.delete(eliminando);
      setElim(null); cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al eliminar');
      notify('error', message, details);
    }
  }

  async function handleEliminarEstudiantes() {
    try {
      const res = await api.delete('/personas/estudiantes') as { message: string };
      notify('success', res.message);
      cargar();
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error');
      notify('error', message, details);
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    try {
      const res = await api.post('/personas/delete-bulk', { ids: Array.from(selected) }) as { message: string };
      notify('success', res.message);
      setSelected(new Set());
      cargar();
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
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || JSON.parse(localStorage.getItem('sgp-session') || '{}').token || ''}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) notify('success', data.mensaje);
      else notify('error', data.mensaje);
      cargar();
    } catch (err: unknown) {
      const { message } = notifyErrorPayload(err, 'Error al importar');
      notify('error', message);
    }
    e.target.value = '';
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Personas</h1>
          <p className="page-subtitle">{personas.length} registros</p>
        </div>
        <div className="flex gap-2">
          {puedeEliminar && (
            <>
              <button onClick={handleEliminarEstudiantes}
                className="soft-btn-secondary text-xs">Dar de baja todos los estudiantes</button>
              {selected.size > 0 && (
                <button onClick={handleDeleteSelected}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                  Eliminar {selected.size} seleccionados
                </button>
              )}
            </>
          )}
          <label className="soft-btn-secondary text-xs cursor-pointer">
            Importar Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
          </label>
          {puedeIngresar && (
            <button onClick={() => { setEditando(null); setShowForm(true); }} className="soft-btn-primary">
              + Nueva Persona
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <input type="search" placeholder="Buscar por nombre o matrícula..."
          value={search} onChange={e => setSearch(e.target.value)} className="soft-input max-w-sm" />
        <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="soft-select max-w-xs">
          <option value="">Todos los tipos</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="PROFESOR">Profesores</option>
          <option value="TECNICO">Técnicos</option>
          <option value="ADMINISTRATIVO">Administrativos</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6">
            <PersonaForm persona={editando} onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }} />
          </div>
        </div>
      )}

      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-gray-800 font-medium">¿Eliminar esta persona?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)} className="px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancelar</button>
              <button onClick={handleEliminar} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-shell">
        {cargando ? (
          <p className="py-12 text-center text-[var(--text-muted)]">Cargando...</p>
        ) : personas.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-muted)]">No hay personas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelected(new Set(personas.map(p => p.id)));
                    else setSelected(new Set());
                  }} checked={selected.size === personas.length && personas.length > 0} />
                </th>
                <th className="px-4 py-3 text-left">Matrícula</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Curso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p: Persona) => (
                <tr key={p.id} className={selected.has(p.id) ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-main)]">{p.matricula || '—'}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{p.nombres} {p.apellidos}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge status-info">{p.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.curso || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {puedeActualizar && (
                      <button onClick={() => { setEditando(p); setShowForm(true); }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => setElim(p.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium">Eliminar</button>
                    )}
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
