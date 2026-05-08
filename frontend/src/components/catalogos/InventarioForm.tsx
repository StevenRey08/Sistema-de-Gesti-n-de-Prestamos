'use client';
import { useState, useEffect } from 'react';
import { ubicacionesApi, categoriasApi } from '../../lib/api';
import FilterableSelect from '../ui/FilterableSelect';
import type { ItemInventario, InventarioPayload, Ubicacion, Categoria, FormErrors } from '../../lib/types';

interface InventarioFormProps {
  item?: ItemInventario | null;
  onGuardar: (form: InventarioPayload) => Promise<void>;
  onCancelar: () => void;
}

interface InventarioFormState {
  codigo: string;
  nombre: string;
  categoria_id: string;
  ubicacion_id: string;
  estado: string;
  cantidad: number | string;
  cantidad_minima: number | string;
}

export default function InventarioForm({ item = null, onGuardar, onCancelar }: InventarioFormProps) {
  const [form, setForm] = useState<InventarioFormState>({
    codigo: item?.codigo || '',
    nombre: item?.nombre || '',
    categoria_id: item?.categoria_id || '',
    ubicacion_id: item?.ubicacion_id || '',
    estado: item?.estado || 'Nuevo',
    cantidad: item?.cantidad || 1,
    cantidad_minima: item?.cantidad_minima || 1,
  });
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [errores, setErrores] = useState<FormErrors<InventarioFormState>>({});
  const [cargando, setCargando] = useState(false);
  const [apiError, setApiError] = useState('');
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState(item?.imagen_ruta || '');

  useEffect(() => {
    categoriasApi.getAll().then((d) => setCategorias(d as Categoria[]));
    ubicacionesApi.getAll().then((d) => setUbicaciones(d as Ubicacion[]));
  }, []);

  useEffect(() => {
    if (!imagenArchivo) return;
    const previewUrl = URL.createObjectURL(imagenArchivo);
    setImagenPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imagenArchivo]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof InventarioFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const e: FormErrors<InventarioFormState> = {};
    if (!form.codigo.trim()) e.codigo = 'Código obligatorio';
    if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio';
    if (!form.cantidad || Number(form.cantidad) < 0) e.cantidad = 'Inválido';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    setApiError('');
    
    const body: InventarioPayload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id || null,
      ubicacion_id: form.ubicacion_id || null,
      estado: form.estado,
      cantidad: Number(form.cantidad),
      cantidad_minima: Number(form.cantidad_minima),
      imagen: imagenArchivo,
    };

    try {
      await onGuardar(body);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{apiError}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Código *</label>
          <input name="codigo" value={form.codigo} onChange={handleChange} className={`soft-input ${errores.codigo ? 'border-red-400' : ''}`} placeholder="Ej: HERR-001" />
          {errores.codigo && <p className="mt-1 text-xs text-red-500">{errores.codigo}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className={`soft-input ${errores.nombre ? 'border-red-400' : ''}`} placeholder="Ej: Martillo" />
          {errores.nombre && <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FilterableSelect
          label="Categoría"
          value={form.categoria_id}
          onChange={(value) => setForm((prev) => ({ ...prev, categoria_id: value }))}
          options={categorias.map((categoria) => ({
            value: categoria.id,
            label: categoria.nombre,
            searchText: categoria.descripcion ?? '',
          }))}
          placeholder="Buscar categoría..."
          emptyLabel="Sin categorías coincidentes"
        />
        <FilterableSelect
          label="Ubicación"
          value={form.ubicacion_id}
          onChange={(value) => setForm((prev) => ({ ...prev, ubicacion_id: value }))}
          options={ubicaciones.map((ubicacion) => ({
            value: ubicacion.id,
            label: `${ubicacion.tipo}: ${ubicacion.codigo} - ${ubicacion.nombre}`,
            searchText: ubicacion.descripcion ?? '',
          }))}
          placeholder="Buscar ubicación..."
          emptyLabel="Sin ubicaciones coincidentes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="soft-select">
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
            <option value="Dañado">Dañado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Cantidad *</label>
          <input type="number" name="cantidad" value={form.cantidad} onChange={handleChange} min={0} className="soft-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Stock Mínimo</label>
          <input type="number" name="cantidad_minima" value={form.cantidad_minima} onChange={handleChange} min={0} className="soft-input" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Imagen del artículo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImagenArchivo(event.target.files?.[0] ?? null)}
            className="soft-input cursor-pointer"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Se permiten imágenes para identificar mejor el objeto del inventario.</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="mb-3 text-sm font-medium text-[var(--text-main)]">Vista previa</p>
          {imagenPreview ? (
            <img src={imagenPreview} alt="Vista previa del artículo" className="h-40 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
              Sin imagen seleccionada
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onCancelar} className="soft-btn-secondary px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={cargando} className="soft-btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {cargando ? 'Guardando...' : item ? 'Actualizar' : 'Agregar al inventario'}
        </button>
      </div>
    </form>
  );
}
