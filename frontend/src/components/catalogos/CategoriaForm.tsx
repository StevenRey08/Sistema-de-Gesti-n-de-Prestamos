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
    <div className="w-full max-w-lg mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111827] border border-slate-800 p-8 rounded-xl shadow-2xl"
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white">
            {initialData ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Completa los detalles para organizar el inventario.</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Dispositivos Móviles"
              value={form.nombre}
              onChange={handleChange}
              className="bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Descripción</label>
            <textarea
              name="descripcion"
              placeholder="Agrega una breve descripción..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              className="bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            Guardar Categoría
          </button>
        </div>
      </form>
    </div>
  );
}
