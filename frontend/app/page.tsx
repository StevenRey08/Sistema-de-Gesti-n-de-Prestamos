import Caja from '../src/components/caja';

export default function Page() {
  const catalogosMaestros = [
    { id: 1, nombre: "Proveedores", detalle: "Registra empresas, teléfonos y correos de tus suministradores." },
    { id: 2, nombre: "Categorías", detalle: "Organiza las herramientas por tipo (Eléctricas, Manuales, etc.)." },
    { id: 3, nombre: "Personas", detalle: "Base de datos de empleados y beneficiarios de préstamos." }
  ];

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '50px 20px',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#111827', fontWeight: '800' }}>
            Catálogos Maestros
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>
            Configuración inicial del Sistema de Inventario
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          justifyItems: 'center'
        }}>
          {catalogosMaestros.map((cat) => (
            <Caja
              key={cat.id}
              titulo={cat.nombre}
              descripcion={cat.detalle}
            />
          ))}
        </div>
      </div>
    </main>
  );
}