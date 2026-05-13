export default function LoadingPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <h1 className="page-title">Panel de control</h1>
        <p className="page-subtitle">Cargando datos...</p>
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stats-card animate-pulse">
            <p className="h-4 rounded w-24" style={{ background: 'var(--border)' }}>&nbsp;</p>
            <p className="mt-2 h-8 rounded w-12" style={{ background: 'var(--border)' }}>&nbsp;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
