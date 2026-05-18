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

  console.log('=== CREAR PRESTAMO MULTI-ITEM ===\n');

  const personasRes = await fetch(`${BASE}/personas?tipo=ESTUDIANTE`, { headers });
  const personas = await personasRes.json();
  const persona = personas[0];

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const inventario = await invRes.json();
  
  console.log('Inventario disponible:');
  inventario.forEach(i => console.log(`  ${i.nombre}: ${i.cantidad_disponible}`));

  const items = inventario.filter(i => i.cantidad_disponible >= 2).slice(0, 3).map(i => ({
    inventario_id: i.id,
    cantidad: 2,
  }));

  if (items.length === 0) {
    console.log('No hay items con stock >= 2');
    return;
  }

  console.log('\nPersona:', persona.nombres, persona.apellidos);
  console.log('Items:', items.map(i => `${i.inventario_id.substring(0, 8)} x${i.cantidad}`).join(', '));

  const createRes = await fetch(`${BASE}/prestamos/lote`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      persona_id: persona.id,
      instructor_id: persona.id,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Prestamo multi-item para prueba de devolucion',
      items,
    }),
  });
  const created = await createRes.json();
  console.log('\nCreado status:', createRes.status);
  console.log('Response:', JSON.stringify(created).substring(0, 300));

  if (created.data?.id) {
    console.log('\n=== DEVOLVER CON ESTADOS MIXTOS ===\n');

    const itemsDevolucion = created.data.detalles.map((d, idx) => ({
      inventario_id: d.inventario_id,
      estado: idx === 0 ? 'BUEN_ESTADO' : idx === 1 ? 'MAL_ESTADO' : 'PERDIDO',
      observaciones: `Prueba estado ${idx === 0 ? 'bueno' : idx === 1 ? 'danado' : 'perdido'}`,
    }));

    console.log('Items devolucion:', JSON.stringify(itemsDevolucion, null, 2));

    const devRes = await fetch(`${BASE}/prestamos/${created.data.id}/devolucion`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        observaciones_dev: 'Devolucion multi-item con estados mixtos',
        items_devolucion: itemsDevolucion,
      }),
    });
    const devData = await devRes.json();
    console.log('\nDevolucion status:', devRes.status);

    if (devData.detalles) {
      console.log('\nDetalles actualizados:');
      devData.detalles.forEach(d => {
        console.log(`  Item: ${d.inventario_id.substring(0, 8)}`);
        console.log(`    Estado: ${d.estado_devolucion}`);
        console.log(`    Buena: ${d.cantidad_devuelta_buena}, Danada: ${d.cantidad_devuelta_danada}, Perdida: ${d.cantidad_perdida}`);
        console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 50)}`);
      });
    } else {
      console.log('No hay detalles en la respuesta');
    }
  }
}

main().catch(e => console.error(e.message));
