import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-soft)] p-8">
      <div className="max-w-md rounded-[32px] border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-2xl">
          404
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-main)]">Página no encontrada</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-8">
          <Link href="/" className="soft-btn-primary inline-flex px-6 py-3 text-sm no-underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
