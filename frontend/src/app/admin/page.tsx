'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import api from '../../lib/api';
import { useNotification } from '../../components/ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

export default function AdminPage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [reseteando, setReseteando] = useState(false);
  const [sembrando, setSembrando] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  if (!user) return null;

  async function handleReset() {
    setReseteando(true);
    setResultado(null);
    try {
      await api.post('/seed/reset', {});
      notify('success', 'Datos limpiados correctamente');
      setResultado('Todos los datos han sido eliminados. Roles, usuarios y permisos preservados.');
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al limpiar datos');
      notify('error', message, details);
    } finally {
      setReseteando(false);
      setConfirmReset(false);
    }
  }

  async function handleSeed() {
    setSembrando(true);
    setResultado(null);
    try {
      const res = await api.post('/seed/seed', {}) as { data: Record<string, number> };
      const d = res.data || res as unknown as Record<string, number>;
      notify('success', 'Datos de ejemplo insertados');
      setResultado([
        `✅ ${d.personas || 0} personas (estudiantes + instructores)`,
        `✅ ${d.herramientas || 0} herramientas en inventario`,
        `✅ ${d.prestamos || 0} préstamos de ejemplo`,
        `✅ ${d.ubicaciones || 0} ubicaciones`,
        `✅ ${d.categorias || 0} categorías`,
        `👤 ${d.usuariosPreservados || 0} usuarios preservados`,
        `🔐 ${d.rolesPreservados || 0} roles preservados`,
      ].join('\n'));
    } catch (e: unknown) {
      const { message, details } = notifyErrorPayload(e, 'Error al insertar datos');
      notify('error', message, details);
    } finally {
      setSembrando(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Herramientas de administración</h1>
          <p className="page-subtitle">Gestión de datos del sistema</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Limpiar datos</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Elimina todos los datos de ejemplo (personas, inventario, préstamos, movimientos, ubicaciones, categorías).
            Los usuarios, roles y permisos se conservan.
          </p>
          {confirmReset ? (
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm font-medium text-red-600">¿Estás seguro?</p>
              <button onClick={handleReset} disabled={reseteando}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {reseteando ? 'Limpiando...' : 'Sí, limpiar todo'}
              </button>
              <button onClick={() => setConfirmReset(false)}
                className="soft-btn-secondary px-4 py-2 text-sm">
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} disabled={reseteando}
              className="soft-btn-secondary mt-4 px-4 py-2 text-sm">
              Limpiar datos
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Insertar datos de ejemplo</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Carga datos de ejemplo: estudiantes, instructores, herramientas, categorías, ubicaciones y préstamos de prueba.
          </p>
          <button onClick={handleSeed} disabled={sembrando}
            className="soft-btn-primary mt-4 px-4 py-2 text-sm">
            {sembrando ? 'Insertando...' : 'Insertar datos de ejemplo'}
          </button>
        </div>
      </div>

      {resultado && (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">Resultado</h3>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{resultado}</pre>
        </div>
      )}
    </div>
  );
}
