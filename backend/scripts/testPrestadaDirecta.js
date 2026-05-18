const BASE = 'http://localhost:4000/api';

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin' }),
  });
  const login = await loginRes.json();
  const token = login.token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('=== CREAR PRESTAMO DIRECTO (sierra) ===\n');

  const personasRes = await fetch(`${BASE}/personas?tipo=ESTUDIANTE`, { headers });
  const personas = await personasRes.json();
  const persona = personas[0];

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const items = await invRes.json();
  const sierra = items.find(i => i.nombre.includes('Sierra Circular'));

  console.log('Item:', sierra.nombre, `Total: ${sierra.cantidad_total}, Disponible: ${sierra.cantidad_disponible}, Prestada (antes): ${sierra.cantidad_prestada}`);

  const prestamoRes = await fetch(`${BASE}/prestamos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inventario_id: sierra.id,
      persona_id: persona.id,
      instructor_id: persona.id,
      cantidad: 2,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Prestamo directo para verificar cantidad_prestada',
    }),
  });
  const prestamo = await prestamoRes.json();
  console.log('\nPrestamo status:', prestamoRes.status);

  console.log('\n=== VERIFICAR cantidad_prestada DESPUES DEL PRESTAMO ===\n');
  const invRes2 = await fetch(`${BASE}/inventario`, { headers });
  const items2 = await invRes2.json();
  const sierra2 = items2.find(i => i.id === sierra.id);

  console.log(`${sierra2.nombre}:`);
  console.log(`  Prestada: ${sierra2.cantidad_prestada} (esperado: 2)`);
  console.log(`  Disponible: ${sierra2.cantidad_disponible} (esperado: ${sierra.cantidad_disponible - 2})`);
  console.log(`  Danada: ${sierra2.cantidad_danada}`);
  console.log(`  Total: ${sierra2.cantidad_total}`);
  console.log(`  Formula: ${sierra2.cantidad_disponible} + ${sierra2.cantidad_danada} + ${sierra2.cantidad_prestada} = ${sierra2.cantidad_disponible + sierra2.cantidad_danada + sierra2.cantidad_prestada} (debe ser ${sierra2.cantidad_total})`);

  console.log('\n=== PRESTAMOS ACTIVOS ===\n');
  const prestRes = await fetch(`${BASE}/prestamos?estado=ACTIVO`, { headers });
  const prestamos = await prestRes.json();
  prestamos.forEach(p => {
    const nombre = p.inventario?.nombre || (p.detalles?.length > 0 ? p.detalles.map(d => d.inventario?.nombre).join(', ') : 'N/A');
    const cant = p.inventario ? p.cantidad : p.detalles?.reduce((s, d) => s + d.cantidad, 0);
    console.log(`${p.id.substring(0,8)} | ${nombre} x${cant} | ${p.estado}`);
  });
}

main().catch(e => console.error(e.message));
