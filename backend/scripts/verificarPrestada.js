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

  console.log('=== ITEMS CON PRESTAMO ACTIVO ===\n');

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const items = await invRes.json();

  items.forEach(i => {
    if (i.cantidad_prestada > 0 || i.nombre.includes('Sierra') || i.nombre.includes('Martillo')) {
      console.log(`${i.nombre}: prestada=${i.cantidad_prestada}, disponible=${i.cantidad_disponible}, danada=${i.cantidad_danada}, total=${i.cantidad_total}`);
    }
  });

  console.log('\n=== PRESTAMOS ACTIVOS ===\n');
  const prestRes = await fetch(`${BASE}/prestamos?estado=ACTIVO`, { headers });
  const prestamos = await prestRes.json();
  prestamos.forEach(p => {
    const nombre = p.detalles?.length > 0
      ? p.detalles.map(d => d.inventario?.nombre).join(', ')
      : p.inventario?.nombre || 'N/A';
    const cant = p.detalles?.length > 0
      ? p.detalles.map(d => `${d.inventario?.nombre} x${d.cantidad}`).join(', ')
      : `${p.inventario?.nombre} x${p.cantidad}`;
    console.log(`${p.id.substring(0,8)} | ${p.persona?.nombres} | ${cant}`);
  });
}

main().catch(e => console.error(e.message));
