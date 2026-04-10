'use client';

export default function Topbar({ titulo = 'Dashboard' }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Título de la página actual */}
      <h1 className="text-xl font-semibold text-gray-800">{titulo}</h1>

      {/* Info del usuario */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Administrador</span>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
      </div>
    </header>
  );
}
