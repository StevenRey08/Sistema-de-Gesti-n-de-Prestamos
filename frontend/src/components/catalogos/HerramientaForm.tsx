'use client';
import { useState, useEffect } from 'react';
import { categoriasApi, proveedoresApi } from '../../lib/api';
import type { Herramienta, HerramientaPayload, Categoria, Proveedor, FormErrors } from '../../lib/types';

interface HerramientaFormProps {
  herramienta?: Herramienta | null;
  onGuardar: (form: HerramientaPayload) => Promise<void>;
  onCancelar: () => void;
}

interface HerramientaFormState {
  codigo: string;
  nombre: string;
  categoria_id: string;
  proveedor_id: string;
  valor_estimado: string;
}

export default function HerramientaForm({ herramienta = null, onGuardar, onCancelar }: HerramientaFormProps) {
  const [form, setForm] = useState<HerramientaFormState>({
    codigo: herramienta?.codigo || '',
    nombre: herramienta?.nombre || '',
    categoria_id: herramienta?.categoria_id ? String(herramienta.categoria_id) : '',
    proveedor_id: herramienta?.proveedor_id ? String(herramienta.proveedor_id) : '',
    valor_estimado: herramienta?.valor_estimado ? String(herramienta.valor_estimado) : '',
  });
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [errores, setErrores] = useState<FormErrors<HerramientaFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    categoriasApi.getAll().then((d) => setCategorias(d as Categoria[]));
    proveedoresApi.getAll().then((d) => setProveedores(d as Proveedor[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name as keyof HerramientaFormState]) setErrores(prev => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<HerramientaFormState> = {};
    if (!form.codigo.trim()) e.codigo = 'Obligatorio';
    if (!form.nombre.trim()) e.nombre = 'Obligatorio';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true); setApiError('');
    const body: HerramientaPayload = {
      ...form,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
      valor_estimado: form.valor_estimado ? parseFloat(form.valor_estimado) : null,
    };
    try { await onGuardar(body); }
    catch (err: unknown) { setApiError(err instanceof Error ? err.message : 'Error'); }
    finally { setCargando(false); }
  }

  const campo = (name: keyof HerramientaFormState, label: string, placeholder: string, requerido = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}{requerido && ' *'}</label>
      <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
        className={`w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border focus:outline-none
          focus:ring-2 focus:ring-blue-500 ${errores[name] ? 'border-red-500' : 'border-gray-600'}`} />
      {errores[name] && <p className="text-xs text-red-400 mt-1">{errores[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">{apiError}</div>}
      <div className="grid grid-cols-2 gap-4">
        {campo('codigo', 'Código', 'Ej: TOOL-001', true)}
        {campo('nombre', 'Nombre de la herramienta', 'Ej: Taladro percutor', true)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
          <select name="categoria_id" value={form.categoria_id} onChange={handleChange}
            className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
          <select name="proveedor_id" value={form.proveedor_id} onChange={handleChange}
            className="w-full rounded-lg px-3 py-2 text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sin proveedor —</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
          </select>
        </div>
        {campo('valor_estimado', 'Valor estimado (RD$)', '0.00')}
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <button type="button" onClick={onCancelar}
          className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors">Cancelar</button>
        <button type="submit" disabled={cargando}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium">
          {cargando ? 'Guardando...' : herramienta ? 'Actualizar' : 'Registrar herramienta'}
        </button>
      </div>
    </form>
  );
}
