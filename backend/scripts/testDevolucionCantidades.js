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
  const itemsDisponibles = inventario.filter(i => i.cantidad_disponible >= 6).slice(0, 2);

  if (itemsDisponibles.length < 2) {
    console.log('No hay suficientes items con stock >= 6');
    return;
  }

  const items = itemsDisponibles.map(i => ({
    inventario_id: i.id,
    cantidad: i.nombre.includes('Mouse') ? 5 : 6,
  }));

  console.log('Persona:', persona.nombres, persona.apellidos);
  items.forEach(it => {
    const inv = inventario.find(i => i.id === it.inventario_id);
    console.log(`  ${inv.nombre} x${it.cantidad}`);
  });

  const createRes = await fetch(`${BASE}/prestamos/lote`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      persona_id: persona.id,
      instructor_id: persona.id,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Prestamo multi-item para prueba de cantidades por estado',
      items,
    }),
  });
  const created = await createRes.json();
  console.log('\nCreado status:', createRes.status);
  const prestamoId = created.data?.id;

  if (!prestamoId) {
    console.log('Error al crear prestamo:', JSON.stringify(created).substring(0, 300));
    return;
  }

  console.log('Prestamo ID:', prestamoId.substring(0, 8));
  console.log('Detalles:', created.data?.detalles?.length);

  console.log('\n=== DEVOLVER CON CANTIDADES POR ESTADO ===\n');

  const itemsDevolucion = [];
  for (const d of created.data.detalles) {
    const inv = inventario.find(i => i.id === d.inventario_id);
    const nombre = inv?.nombre || 'Item';
    const cant = d.cantidad;

    if (nombre.includes('Cable')) {
      itemsDevolucion.push({ inventario_id: d.inventario_id, estado: 'BUEN_ESTADO', cantidad: 2, observaciones: 'Funcionan bien' });
      itemsDevolucion.push({ inventario_id: d.inventario_id, estado: 'MAL_ESTADO', cantidad: 4, observaciones: 'Rollo danado' });
    } else {
      itemsDevolucion.push({ inventario_id: d.inventario_id, estado: 'BUEN_ESTADO', cantidad: 3, observaciones: 'OK' });
      itemsDevolucion.push({ inventario_id: d.inventario_id, estado: 'PERDIDO', cantidad: 3, observaciones: 'No aparecen' });
    }
  }

  console.log('Items devolucion:', JSON.stringify(itemsDevolucion, null, 2));

  const devRes = await fetch(`${BASE}/prestamos/${prestamoId}/devolucion`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      observaciones_dev: 'Devolucion con cantidades por estado',
      items_devolucion: itemsDevolucion,
    }),
  });
  const devData = await devRes.json();
  console.log('\nDevolucion status:', devRes.status);

  if (devData.detalles) {
    console.log('\nDetalles actualizados:');
    devData.detalles.forEach(d => {
      const inv = inventario.find(i => i.id === d.inventario_id);
      console.log(`  ${inv?.nombre || 'Item'}:`);
      console.log(`    Cant original: ${d.cantidad}`);
      console.log(`    Buena: ${d.cantidad_devuelta_buena}, Danada: ${d.cantidad_devuelta_danada}, Perdida: ${d.cantidad_perdida}`);
      console.log(`    Estado dev: ${d.estado_devolucion}`);
      console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 60)}`);
    });
  }

  console.log('\nPrestamo estado:', devData.estado);
  console.log('Observaciones:', (devData.observaciones || '').substring(0, 150));
}

main().catch(e => console.error(e.message));
