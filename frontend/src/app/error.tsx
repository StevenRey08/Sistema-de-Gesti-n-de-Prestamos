'use client';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-soft)] p-8">
      <div className="max-w-md rounded-[32px] border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
          ✕
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-main)]">Error inesperado</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Ocurrió un error al cargar esta página. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="soft-btn-primary px-6 py-3 text-sm">
            Intentar de nuevo
          </button>
          <Link href="/" className="soft-btn-secondary px-6 py-3 text-sm no-underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
