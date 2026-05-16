'use client';
import { useState } from 'react';
import api from '../../lib/api';

export default function RecuperarPage() {
  const [step, setStep] = useState<'email' | 'codigo' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/solicitar-codigo', { email }) as { mensaje: string };
      setMensaje(res.mensaje);
      setStep('codigo');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar código');
    } finally { setLoading(false); }
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verificar-codigo', { email, codigo });
      setStep('password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, codigo, nueva_contrasena: password });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'email' && 'Ingresa tu correo para recibir un código'}
            {step === 'codigo' && 'Ingresa el código que recibiste'}
            {step === 'password' && 'Ingresa tu nueva contraseña'}
            {step === 'done' && 'Contraseña actualizada'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
        {mensaje && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">{mensaje}</div>}

        {step === 'email' && (
          <form onSubmit={handleEnviarCodigo} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {step === 'codigo' && (
          <form onSubmit={handleVerificarCodigo} className="space-y-4">
            <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="000000" required maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button type="button" onClick={() => setStep('email')} className="w-full text-sm text-blue-600 hover:underline">Reenviar código</button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva contraseña" required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">Tu contraseña ha sido actualizada.</p>
            <a href="/login" className="inline-block py-3 px-8 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
              Ir al inicio de sesión
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
