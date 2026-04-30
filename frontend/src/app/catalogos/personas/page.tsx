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
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Personas</h1>
          <p className="text-sm text-gray-400 mt-1">{personas.length} registros</p>
        </div>
        <button
          onClick={() => { setEditando(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva Persona
        </button>
      </div>

      {/* Búsqueda */}
      <input
        type="search" placeholder="Buscar por nombre o documento..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-600 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Error */}
      {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Modal Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#111827] rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <h2 className="text-lg font-bold text-gray-500 mb-4">
              {editando ? 'Editar Persona' : 'Registrar Nueva Persona'}
            </h2>
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

      {/* Tabla */}
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        {cargando ? (
          <p className="text-gray-400 text-center py-12">Cargando...</p>
        ) : personas.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No hay personas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {personas.map((p: Persona) => (
                <tr key={p.id} className="text-gray-300 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{p.tipo_documento} {p.numero_documento}</td>
                  <td className="px-4 py-3 font-medium text-white">{p.nombres} {p.apellidos}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">{p.tipo}</span>
                  </td>
                  <td className="px-4 py-3">{p.telefono || '—'}</td>
                  <td className="px-4 py-3">{p.email || '—'}</td>
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
