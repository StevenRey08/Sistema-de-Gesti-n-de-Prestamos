'use client';

import { useCallback, useEffect, useState } from 'react';
import { politicasApi } from '../../lib/api';
import type { PoliticaSeguridad } from '../../lib/types';
import { useNotification } from '../ui/NotificationContext';
import { notifyErrorPayload } from '../../lib/errors';

const POLITICAS_LABELS: Record<string, string> = {
  PASSWORD_MIN_LENGTH: 'Longitud mínima',
  PASSWORD_REQUIRE_UPPERCASE: 'Requerir mayúsculas',
  PASSWORD_REQUIRE_LOWERCASE: 'Requerir minúsculas',
  PASSWORD_REQUIRE_NUMBER: 'Requerir números',
  PASSWORD_REQUIRE_SPECIAL: 'Requerir caracteres especiales',
  PASSWORD_EXPIRY_DAYS: 'Expiración de contraseña (días)',
  MAX_FAILED_LOGIN_ATTEMPTS: 'Máx. intentos fallidos',
  LOCKOUT_DURATION_MINUTES: 'Duración bloqueo (min)',
  SESSION_TIMEOUT_HOURS: 'Timeout sesión (horas)',
  AUDIT_LOG_RETENTION_DAYS: 'Retención logs (días)',
};

const POLITICAS_CATEGORIAS: Record<string, string> = {
  PASSWORD_MIN_LENGTH: 'contrasena',
  PASSWORD_REQUIRE_UPPERCASE: 'contrasena',
  PASSWORD_REQUIRE_LOWERCASE: 'contrasena',
  PASSWORD_REQUIRE_NUMBER: 'contrasena',
  PASSWORD_REQUIRE_SPECIAL: 'contrasena',
  PASSWORD_EXPIRY_DAYS: 'contrasena',
  MAX_FAILED_LOGIN_ATTEMPTS: 'login',
  LOCKOUT_DURATION_MINUTES: 'login',
  SESSION_TIMEOUT_HOURS: 'sesion',
  AUDIT_LOG_RETENTION_DAYS: 'auditoria',
};

function esBooleana(clave: string) {
  return clave.startsWith('PASSWORD_REQUIRE_');
}

export default function PoliticasTab() {
  const { notify } = useNotification();
  const [politicas, setPoliticas] = useState<PoliticaSeguridad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [guardando, setGuardando] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await politicasApi.getAll() as PoliticaSeguridad[];
      setPoliticas(data);
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'No se pudo cargar las políticas.');
      notify('error', message, details);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleSave(id: string) {
    setGuardando(true);
    try {
      await politicasApi.update(id, { valor: editValue });
      notify('success', 'Política actualizada');
      setEditingId(null);
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al actualizar política');
      notify('error', message, details);
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggle(id: string, currentValue: string) {
    setGuardando(true);
    try {
      const nuevoValor = currentValue === 'true' ? 'false' : 'true';
      await politicasApi.update(id, { valor: nuevoValor });
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al actualizar política');
      notify('error', message, details);
    } finally {
      setGuardando(false);
    }
  }

  async function handleSeed() {
    try {
      const res = await politicasApi.seed() as { message: string };
      notify('success', res.message || 'Políticas por defecto creadas');
      await loadData();
    } catch (err) {
      const { message, details } = notifyErrorPayload(err, 'Error al crear políticas por defecto');
      notify('error', message, details);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-DO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  const categorias = [
    { key: 'contrasena', label: 'Contraseña' },
    { key: 'login', label: 'Inicio de sesión' },
    { key: 'sesion', label: 'Sesión' },
    { key: 'auditoria', label: 'Auditoría' },
  ];

  return (
    <section className="space-y-6">
      <div className="flex justify-end gap-2">
        <button onClick={handleSeed} className="soft-btn-secondary text-sm">Crear políticas por defecto</button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[var(--text-muted)]">Cargando políticas...</p>
      ) : politicas.length === 0 ? (
        <p className="py-12 text-center text-[var(--text-muted)]">No hay políticas configuradas. Haz clic en "Crear políticas por defecto".</p>
      ) : (
        categorias.map(cat => {
          const politicasCat = politicas.filter(p => POLITICAS_CATEGORIAS[p.clave] === cat.key);
          if (politicasCat.length === 0) return null;
          return (
            <div key={cat.key} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">{cat.label}</h3>
              <div className="surface-card rounded-xl overflow-hidden">
                <div className="divide-y">
                  {politicasCat.map((politica) => {
                    const esBool = esBooleana(politica.clave);
                    const esActivo = politica.valor === 'true';
                    return (
                      <div key={politica.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text-main)]">
                            {POLITICAS_LABELS[politica.clave] || politica.clave}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{politica.descripcion || politica.clave}</p>
                          {politica.modificado_por && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              Última modificación: {formatDate(politica.ultima_modificacion)} por {politica.modificado_por.nombre} {politica.modificado_por.apellido}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {esBool ? (
                            <>
                              <button
                                onClick={() => handleToggle(politica.id, politica.valor)}
                                disabled={guardando}
                                className={`relative w-12 h-6 rounded-full transition-colors ${esActivo ? 'bg-green-500' : 'bg-gray-300'}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${esActivo ? 'translate-x-6' : ''}`} />
                              </button>
                              <span className={`text-xs font-medium ${esActivo ? 'text-green-600' : 'text-gray-500'}`}>
                                {esActivo ? 'Sí' : 'No'}
                              </span>
                            </>
                          ) : editingId === politica.id ? (
                            <>
                              <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                className="soft-input w-32 text-sm" />
                              <button onClick={() => handleSave(politica.id)} disabled={guardando}
                                className="text-sm font-medium text-[var(--accent)]">
                                {guardando ? '...' : 'Guardar'}
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
                            </>
                          ) : (
                            <>
                              <span className="font-mono text-sm bg-[var(--accent-soft)] px-3 py-1 rounded-full text-[var(--accent-strong)]">
                                {politica.valor}
                              </span>
                              <button onClick={() => { setEditingId(politica.id); setEditValue(politica.valor); }}
                                className="text-sm font-medium text-[var(--accent)]">Editar</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
