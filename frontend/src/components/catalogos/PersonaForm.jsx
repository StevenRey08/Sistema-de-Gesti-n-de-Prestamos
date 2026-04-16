'use client';
import { useState } from 'react';

const TIPOS_DOC = ['Cédula', 'Pasaporte', 'RNC', 'Otro'];
const TIPOS_PERS = ['Estudiante', 'Profesor', 'Técnico', 'Administrativo'];

export default function PersonaForm({ persona = null, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    tipo_documento: persona?.tipo_documento || 'Cédula',
    numero_documento: persona?.numero_documento || '',
    nombres: persona?.nombres || '',
    apellidos: persona?.apellidos || '',
    tipo: persona?.tipo || 'Estudiante',
    telefono: persona?.telefono || '',
    email: persona?.email || '',
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e = {};
    if (!form.numero_documento.trim()) e.numero_documento = 'Obligatorio';
    if (!form.nombres.trim()) e.nombres = 'Obligatorio';
    if (!form.apellidos.trim()) e.apellidos = 'Obligatorio';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email no válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setApiError('');
    try {
      await onGuardar(form);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // CAMPO EDITADO PARA DARK MODE
  const campo = (name, label, placeholder, tipo = 'text', requerido = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
        {label}{requerido && ' *'}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        type={tipo}
        className={`w-full bg-[#0f172a] border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all
          ${errores[name] ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700 hover:border-slate-600'}`}
      />
      {errores[name] && <p className="text-[10px] text-red-400 mt-1 ml-1">{errores[name]}</p>}
    </div>
  );

  return (
    // CONTENEDOR PRINCIPAL OSCURO
    <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full">
      {/* Encabezado */}
      <div className="p-6 border-b border-slate-800/50">
        <h2 className="text-xl font-bold text-white">
          {persona ? 'Editar Persona' : 'Registrar Nueva Persona'}
        </h2>
        <p className="text-slate-500 text-xs mt-1">Completa la información para actualizar la lista de registros.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs px-4 py-3 rounded-lg animate-pulse">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de documento</label>
            <select
              name="tipo_documento"
              value={form.tipo_documento}
              onChange={handleChange}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
            >
              {TIPOS_DOC.map(t => <option key={t} value={t} className="bg-[#111827]">{t}</option>)}
            </select>
          </div>
          {campo('numero_documento', 'Número de documento', '000-0000000-0', 'text', true)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {campo('nombres', 'Nombres', 'Ej: Juan Carlos', 'text', true)}
          {campo('apellidos', 'Apellidos', 'Ej: Pérez García', 'text', true)}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de Persona</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
            >
              {TIPOS_PERS.map(t => <option key={t} value={t} className="bg-[#111827]">{t}</option>)}
            </select>
          </div>
          {campo('telefono', 'Teléfono', '809-000-0000')}
          {campo('email', 'Email', 'correo@ejemplo.com', 'email')}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50 mt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-8 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-all font-bold shadow-lg shadow-blue-900/20 active:scale-95 uppercase tracking-widest"
          >
            {cargando ? 'Guardando...' : persona ? 'Actualizar' : 'Registrar persona'}
          </button>
        </div>
      </form>
    </div>
  );
}
