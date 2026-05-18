'use client';
import { useState, useEffect } from 'react';
import { categoriasApi, imagenUrl } from '../../lib/api';
import FilterableSelect from '../ui/FilterableSelect';
import type { ItemInventario, InventarioPayload, Categoria, FormErrors } from '../../lib/types';
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
  cantidad_total: number | string;
  cantidad_disponible: number | string;
  cantidad_danada: number | string;
  imagen_ruta: string;
}

export default function InventarioForm({ item = null, onGuardar, onCancelar }: InventarioFormProps) {
  const { notify } = useNotification();
  const [form, setForm] = useState<InventarioFormState>({
    codigo: item?.codigo || '',
    nombre: item?.nombre || '',
    categoria_id: item?.categoria_id || '',
    cantidad_total: item?.cantidad_total || 0,
    cantidad_disponible: item?.cantidad_disponible || 0,
    cantidad_danada: item?.cantidad_danada || 0,
    imagen_ruta: item?.imagen_ruta || '',
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string>(imagenUrl(item?.imagen_ruta) || '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errores, setErrores] = useState<FormErrors<InventarioFormState>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    categoriasApi.getAll().then((d) => setCategorias(d as Categoria[]));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'cantidad_total') {
        const total = Number(value);
        const danada = Number(prev.cantidad_danada);
        next.cantidad_disponible = Math.max(0, total - danada);
      }
      if (name === 'cantidad_danada') {
        const total = Number(prev.cantidad_total);
        const danada = Number(value);
        next.cantidad_disponible = Math.max(0, total - danada);
      }
      return next;
    });
    if (errores[name as keyof InventarioFormState]) setErrores((prev) => ({ ...prev, [name]: '' }));
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setArchivo(file);
    if (file) setVistaPrevia(URL.createObjectURL(file));
    else setVistaPrevia(imagenUrl(form.imagen_ruta) || '');
  }

  function validar() {
    const e: FormErrors<InventarioFormState> = {};
    if (!form.nombre.trim()) e.nombre = 'Nombre obligatorio';
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
      const payload: InventarioPayload = {
        nombre: form.nombre.trim(),
        categoria_id: form.categoria_id || null,
        cantidad_total: Number(form.cantidad_total),
        cantidad_disponible: Number(form.cantidad_disponible),
        cantidad_danada: Number(form.cantidad_danada),
      };

      if (archivo) {
        const fd = new FormData();
        fd.append('imagen', archivo);
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
        if (form.codigo.trim()) fd.append('codigo', form.codigo.trim().toUpperCase());
        await onGuardar(fd);
      } else {
        payload.codigo = form.codigo.trim().toUpperCase() || undefined;
        payload.imagen_ruta = form.imagen_ruta || null;
        await onGuardar(payload);
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
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Código <span className="text-[var(--text-muted)]">(opcional)</span></label>
          <input name="codigo" value={form.codigo} onChange={handleChange} className="soft-input" placeholder="Dejar vacío para auto-generar" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Nombre *</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} className="soft-input" placeholder="Ej: Martillo" />
        </div>
      </div>

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Total</label>
          <input type="number" name="cantidad_total" value={form.cantidad_total} onChange={handleChange} min={0} className="soft-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Disponible</label>
          <input type="number" name="cantidad_disponible" value={form.cantidad_disponible} onChange={handleChange} min={0} className="soft-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">Dañado</label>
          <input type="number" name="cantidad_danada" value={form.cantidad_danada} onChange={handleChange} min={0} className="soft-input" />
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
          <input name="imagen_ruta" value={form.imagen_ruta} onChange={handleChange} className="soft-input" placeholder="https://ejemplo.com/imagen.jpg" disabled={!!archivo} />
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
