const BASE = 'http://localhost:4000/api';

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin' }),
  });
  const login = await loginRes.json();
  const token = login.token;
  const headers = { 'Authorization': `Bearer ${token}` };

  const prestamosRes = await fetch(`${BASE}/prestamos?estado=ACTIVO`, { headers });
  const prestamos = await prestamosRes.json();

  console.log('Prestamos activos:\n');
  prestamos.forEach(p => {
    const nombre = p.detalles && p.detalles.length > 0
      ? p.detalles.map(d => d.inventario?.nombre).join(', ')
      : p.inventario?.nombre || 'N/A';
    const cant = p.detalles && p.detalles.length > 0
      ? p.detalles.map(d => `${d.inventario?.nombre} x${d.cantidad}`).join(', ')
      : `${p.inventario?.nombre} x${p.cantidad}`;
    console.log(`  ${p.id.substring(0, 8)} | ${p.persona?.nombres} | ${cant}`);
  });

  console.log('\n\nInventario items con prestamo activo:\n');
  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const items = await invRes.json();
  items.filter(i => i.cantidad_prestada > 0).forEach(i => {
    console.log(`${i.nombre}: Prestada=${i.cantidad_prestada}, Disponible=${i.cantidad_disponible}, Total=${i.cantidad_total}`);
  });
}

main().catch(e => console.error(e.message));
