'use client';
import { useState } from 'react';

const TIPOS_DOC  = ['Cédula', 'Pasaporte', 'RNC', 'Otro'];
const TIPOS_PERS = ['Estudiante', 'Profesor', 'Técnico', 'Administrativo'];

export default function PersonaForm({ persona = null, onGuardar, onCancelar }) {
  const [form, setForm]     = useState({
    tipo_documento:   persona?.tipo_documento   || 'Cédula',
    numero_documento: persona?.numero_documento || '',
    nombres:          persona?.nombres          || '',
    apellidos:        persona?.apellidos        || '',
    tipo:             persona?.tipo             || 'Estudiante',
    telefono:         persona?.telefono         || '',
    email:            persona?.email            || '',
  });
  const [errores, setErrores]   = useState({});
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
    if (!form.nombres.trim())          e.nombres          = 'Obligatorio';
    if (!form.apellidos.trim())        e.apellidos        = 'Obligatorio';
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

  const campo = (name, label, placeholder, tipo = 'text', requerido = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{requerido && ' *'}</label>
      <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} type={tipo}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
          ${errores[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
      {errores[name] && <p className="text-xs text-red-500 mt-1">{errores[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{apiError}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {campo('numero_documento', 'Número de documento', '000-0000000-0', 'text', true)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {campo('nombres',   'Nombres',   'Ej: Juan Carlos', 'text', true)}
        {campo('apellidos', 'Apellidos', 'Ej: Pérez García', 'text', true)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select name="tipo" value={form.tipo} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TIPOS_PERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {campo('telefono', 'Teléfono',  '809-000-0000')}
        {campo('email',    'Email',     'correo@ejemplo.com', 'email')}
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
          {cargando ? 'Guardando...' : persona ? 'Actualizar' : 'Registrar persona'}
        </button>
      </div>
    </form>
  );
}
