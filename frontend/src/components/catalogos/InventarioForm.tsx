'use client';
import { useState, useEffect } from 'react';
import { ubicacionesApi, categoriasApi, imagenUrl } from '../../lib/api';
import FilterableSelect from '../ui/FilterableSelect';
import type { ItemInventario, InventarioPayload, Ubicacion, Categoria, FormErrors } from '../../lib/types';
import { notifyErrorPayload } from '../../lib/errors';
import { useNotification } from '../ui/NotificationContext';

interface InventarioFormProps {
  item?: ItemInventario | null;
  onGuardar: (form: InventarioPayload | FormData) => Promise<void>;
  onCancelar: () => void;
}

interface InventarioFormState {
  codigo: string;
  nombre: string;
  categoria_id: string;
  ubicacion_id: string;
  estado: string;
  cantidad: number | string;
  imagen_ruta: string;
}

export default function InventarioForm({ item = null, onGuardar, onCancelar }: InventarioFormProps) {
  const { notify } = useNotification();
  const [form, setForm] = useState<InventarioFormState>({
    codigo: item?.codigo || '',
    nombre: item?.nombre || '',
    categoria_id: item?.categoria_id || '',
    ubicacion_id: item?.ubicacion_id || '',
    estado: item?.estado || 'Nuevo',
    cantidad: item?.cantidad || 1,
    imagen_ruta: item?.imagen_ruta || '',
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string>(imagenUrl(item?.imagen_ruta) || '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [errores, setErrores] = useState<FormErrors<InventarioFormState>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    categoriasApi.getAll().then((d) => setCategorias(d as Categoria[]));
    ubicacionesApi.getAll().then((d) => setUbicaciones(d as Ubicacion[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof InventarioFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setArchivo(file);
    if (file) {
      setVistaPrevia(URL.createObjectURL(file));
    } else {
      setVistaPrevia(imagenUrl(form.imagen_ruta) || '');
    }
  }

  function validar() {
    const e: FormErrors<InventarioFormState> = {};
    if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio';
    if (!form.cantidad || Number(form.cantidad) < 0) e.cantidad = 'Inválido';
    setErrores(e);
    const detalles = Object.entries(e).map(([campo, mensaje]) => `${campo}: ${mensaje}`);
    if (detalles.length > 0) notify('error', 'Revisa los datos del inventario', detalles);
    return detalles.length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);

    try {
      if (archivo) {
        const fd = new FormData();
        fd.append('imagen', archivo);
        fd.append('nombre', form.nombre.trim());
        fd.append('estado', form.estado);
        fd.append('cantidad', String(form.cantidad));
        if (form.categoria_id) fd.append('categoria_id', form.categoria_id);
        if (form.ubicacion_id) fd.append('ubicacion_id', form.ubicacion_id);
        const codigoTrimmed = form.codigo.trim().toUpperCase();
        if (codigoTrimmed) fd.append('codigo', codigoTrimmed);
        await onGuardar(fd);
      } else {
        const codigoTrimmed = form.codigo.trim().toUpperCase();
        const body: InventarioPayload = {
          ...(codigoTrimmed ? { codigo: codigoTrimmed } : {}),
          nombre: form.nombre.trim(),
          categoria_id: form.categoria_id || null,
          ubicacion_id: form.ubicacion_id || null,
          estado: form.estado,
          cantidad: Number(form.cantidad),
          imagen_ruta: form.imagen_ruta || null,
        };
        await onGuardar(body);
      }
    } catch (err: unknown) {
      const { message, details } = notifyErrorPayload(err, 'Error al guardar');
      notify('error', message, details);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Código <span className="text-[var(--text-muted)]">(opcional — se auto-genera si se deja vacío)</span></label>
          <input name="codigo" value={form.codigo} onChange={handleChange} className="soft-input" placeholder="Dejar vacío para auto-generar" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="soft-input" placeholder="Ej: Martillo" />
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
          disabled={!!item}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Subir archivo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleArchivo}
            className="soft-input text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1 file:text-sm file:text-white hover:file:opacity-90"
          />
          {vistaPrevia && (
            <div className="mt-2">
              <img src={vistaPrevia} alt="Vista previa" className="max-h-32 rounded object-contain" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span>o pega una URL externa</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">URL de la imagen</label>
          <input
            name="imagen_ruta"
            value={form.imagen_ruta}
            onChange={handleChange}
            className="soft-input"
            placeholder="https://ejemplo.com/imagen.jpg"
            disabled={!!archivo}
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Alternativamente, pega una URL externa</p>
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
