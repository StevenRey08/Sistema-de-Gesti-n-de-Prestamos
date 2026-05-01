'use client';
import { useState } from 'react';
import type { Categoria, CategoriaPayload } from '../../lib/types';

interface CategoriaFormProps {
  initialData?: Categoria | null;
  onSuccess: (form: CategoriaPayload) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  nombre: string;
  descripcion: string;
}

export default function CategoriaForm({ initialData = null, onSuccess, onCancel }: CategoriaFormProps) {
  const [form, setForm] = useState<FormState>({
    nombre: initialData?.nombre ?? '',
    descripcion: initialData?.descripcion ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    void onSuccess({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined });
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-main)]">{initialData ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Completa los detalles para organizar el inventario.</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Nombre</label>
            <input type="text" name="nombre" placeholder="Ej. Dispositivos Móviles" value={form.nombre} onChange={handleChange} className="soft-input" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Descripción</label>
            <textarea name="descripcion" placeholder="Agrega una breve descripción..." value={form.descripcion} onChange={handleChange} rows={3} className="soft-textarea" />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="soft-btn-secondary px-5 py-2 text-sm">Cancelar</button>
          <button type="submit" className="soft-btn-primary px-8 py-2 text-sm">Guardar categoría</button>
        </div>
      </form>
    </div>
  );
}
