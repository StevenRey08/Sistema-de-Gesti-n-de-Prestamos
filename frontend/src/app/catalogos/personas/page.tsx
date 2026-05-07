'use client';
import { useState, useEffect, useCallback } from 'react';
import { personasApi } from '../../../lib/api';
import PersonaForm from '../../../components/catalogos/PersonaForm';
import type { Persona, PersonaPayload } from '../../../lib/types';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [search, setSearch] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);   // persona a editar
  const [eliminando, setElim] = useState<number | null>(null);   // id a eliminar

  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setPersonas(await personasApi.getAll(search) as Persona[]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCargando(false); }
  }, [search]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleGuardar(form: PersonaPayload) {
    if (editando) await personasApi.update(editando.id, form);
    else await personasApi.create(form);
    setShowForm(false); setEditando(null);
    cargar();
  }

  async function handleEliminar() {
    if (eliminando) await personasApi.delete(eliminando);
    setElim(null); cargar();
  }

  function abrirEditar(p: Persona) { setEditando(p); setShowForm(true); }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Personas</h1>
          <p className="page-subtitle">{personas.length} registros</p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowForm(true); }}
          className="soft-btn-primary"
        >
          + Nueva Persona
        </button>
      </div>

      <input
        type="search" placeholder="Buscar por nombre o documento..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="soft-input max-w-sm"
      />

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-panel w-full max-w-2xl p-6">
            <PersonaForm
              persona={editando}
              onGuardar={handleGuardar}
              onCancelar={() => { setShowForm(false); setEditando(null); }}
            />
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-gray-800 font-medium">¿Eliminar esta persona?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setElim(null)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancelar</button>
              <button onClick={handleEliminar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Sí, eliminar
              </button>
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
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personas.map((p: Persona) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-main)]">{p.tipo_documento} {p.numero_documento}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-main)]">{p.nombres} {p.apellidos}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge status-info">{p.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.telefono || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => abrirEditar(p)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Editar</button>
                    <button onClick={() => setElim(p.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium">Eliminar</button>
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
