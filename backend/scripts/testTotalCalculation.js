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

  console.log('=== TEST 1: Crear item y verificar total ===\n');
  const createRes = await fetch(`${BASE}/inventario`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      codigo: 'TEST-' + Date.now(),
      nombre: 'Test Inventario Total',
      cantidad_total: 20,
      cantidad_disponible: 18,
      cantidad_danada: 2,
    }),
  });
  const created = await createRes.json();
  console.log('Creado:', created.nombre);
  console.log(`  Total: ${created.cantidad_total}, Disponible: ${created.cantidad_disponible}, Danada: ${created.cantidad_danada}`);
  const itemId = created.id;

  console.log('\n=== TEST 2: Prestar 5 unidades ===\n');
  const personasRes = await fetch(`${BASE}/personas?tipo=ESTUDIANTE`, { headers });
  const personas = await personasRes.json();
  const persona = personas[0];

  const prestamoRes = await fetch(`${BASE}/prestamos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inventario_id: itemId,
      persona_id: persona.id,
      instructor_id: persona.id,
      cantidad: 5,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Test prestamo',
    }),
  });
  const prestamo = await prestamoRes.json();
  console.log('Prestamo status:', prestamoRes.status);

  const invAfterPrestamo = await fetch(`${BASE}/inventario/${itemId}`, { headers });
  const afterPrestamo = await invAfterPrestamo.json();
  console.log('Despues del prestamo:');
  console.log(`  Total: ${afterPrestamo.cantidad_total}, Disponible: ${afterPrestamo.cantidad_disponible}, Danada: ${afterPrestamo.cantidad_danada}`);
  const expectedDisponible = 18 - 5;
  console.log(`  Esperado disponible: ${expectedDisponible} (18 - 5)`);

  console.log('\n=== TEST 3: Actualizar cantidad danada (de 2 a 4) ===\n');
  const updateRes = await fetch(`${BASE}/inventario/${itemId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      cantidad_danada: 4,
    }),
  });
  const afterUpdate = await updateRes.json();
  console.log('Despues de actualizar danada:');
  console.log(`  Total: ${afterUpdate.cantidad_total}, Disponible: ${afterUpdate.cantidad_disponible}, Danada: ${afterUpdate.cantidad_danada}`);
  console.log(`  Esperado total: ${afterUpdate.cantidad_disponible + afterUpdate.cantidad_danada + 5} (disponible + danada + prestada)`);

  console.log('\n=== TEST 4: Verificar movimiento de ACTUALIZACION_STOCK ===\n');
  const movRes = await fetch(`${BASE}/movimientos?inventario_id=${itemId}`, { headers });
  const movimientos = await movRes.json();
  const actualizacionMovs = movimientos.filter(m => m.tipo === 'ACTUALIZACION_STOCK');
  console.log('Movimientos ACTUALIZACION_STOCK:', actualizacionMovs.length);
  actualizacionMovs.forEach(m => {
    console.log(`  ${m.fecha?.split('T')[0]} | ${m.tipo} | Cant: ${m.cantidad} | ${m.observaciones}`);
  });

  console.log('\n=== TEST 5: Devolver prestamo (3 buena, 2 danada) ===\n');
  const devRes = await fetch(`${BASE}/prestamos/${prestamo.data?.id || prestamo.id}/devolucion`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      observaciones_dev: 'Devolucion test',
      items_devolucion: [
        { inventario_id: itemId, estado: 'BUEN_ESTADO', cantidad: 3, observaciones: 'Buenas' },
        { inventario_id: itemId, estado: 'MAL_ESTADO', cantidad: 2, observaciones: 'Danadas' },
      ],
    }),
  });
  const devData = await devRes.json();
  console.log('Devolucion status:', devRes.status);

  const invFinal = await fetch(`${BASE}/inventario/${itemId}`, { headers });
  const finalInv = await invFinal.json();
  console.log('\nEstado final:');
  console.log(`  Total: ${finalInv.cantidad_total}, Disponible: ${finalInv.cantidad_disponible}, Danada: ${finalInv.cantidad_danada}`);
  console.log(`  Formula: disponible(${finalInv.cantidad_disponible}) + danada(${finalInv.cantidad_danada}) + prestada(0) = ${finalInv.cantidad_disponible + finalInv.cantidad_danada}`);

  console.log('\nMovimientos finales:');
  const movFinal = await fetch(`${BASE}/movimientos?inventario_id=${itemId}`, { headers });
  const movsFinal = await movFinal.json();
  movsFinal.forEach(m => {
    console.log(`  ${m.fecha?.split('T')[0]} | ${m.tipo} | Cant: ${m.cantidad} | ${(m.observaciones || '').substring(0, 60)}`);
  });

  process.exit(0);
}

main().catch(e => console.error(e.message));
