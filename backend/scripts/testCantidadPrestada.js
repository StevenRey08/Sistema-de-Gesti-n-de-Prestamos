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

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const items = await invRes.json();

  console.log('Inventario con cantidad_prestada:\n');
  items.forEach(i => {
    const prestada = i.cantidad_prestada || 0;
    if (prestada > 0 || i.nombre.includes('Calibrador') || i.nombre.includes('Sierra')) {
      console.log(`${i.nombre}`);
      console.log(`  Total: ${i.cantidad_total}, Disponible: ${i.cantidad_disponible}, Danada: ${i.cantidad_danada}, Prestada (API): ${prestada}`);
    }
  });
}

main().catch(e => console.error(e.message));
