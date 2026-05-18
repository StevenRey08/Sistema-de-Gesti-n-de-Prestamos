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

  console.log('=== CREAR PRESTAMO PARA PRUEBA DE PERDIDO ===\n');

  const personasRes = await fetch(`${BASE}/personas?tipo=ESTUDIANTE`, { headers });
  const personas = await personasRes.json();
  const persona = personas[0];

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const inventario = await invRes.json();
  const sierra = inventario.find(i => i.nombre.includes('Sierra Circular'));

  console.log('Item:', sierra.nombre, `Total: ${sierra.cantidad_total}, Disponible: ${sierra.cantidad_disponible}`);

  const prestamoRes = await fetch(`${BASE}/prestamos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inventario_id: sierra.id,
      persona_id: persona.id,
      instructor_id: persona.id,
      cantidad: 3,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Prestamo para prueba de perdido',
    }),
  });
  const prestamo = await prestamoRes.json();
  console.log('\nPrestamo status:', prestamoRes.status);
  const prestamoId = prestamo.data?.id || prestamo.id;
  console.log('Prestamo ID:', prestamoId);

  console.log('\n=== ANTES DE REPORTAR PERDIDO ===');
  const invAntes = await fetch(`${BASE}/inventario/${sierra.id}`, { headers });
  const antes = await invAntes.json();
  console.log(`  Total: ${antes.cantidad_total}, Disponible: ${antes.cantidad_disponible}, Danada: ${antes.cantidad_danada}`);

  console.log('\n=== REPORTAR 2 DE 3 COMO PERDIDO ===\n');
  const perdidoRes = await fetch(`${BASE}/prestamos/${prestamoId}/perdido`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      observaciones: 'Se perdieron durante transporte al laboratorio',
      items_perdidos: [
        { inventario_id: sierra.id, cantidad: 2, observaciones: 'Se cayeron del vehiculo' },
      ],
    }),
  });
  const perdidoData = await perdidoRes.json();
  console.log('Perdido status:', perdidoRes.status);
  console.log('Prestamo estado:', perdidoData.estado);
  console.log('Observaciones:', (perdidoData.observaciones || '').substring(0, 100));

  console.log('\n=== DESPUES DE REPORTAR PERDIDO ===');
  const invDespues = await fetch(`${BASE}/inventario/${sierra.id}`, { headers });
  const despues = await invDespues.json();
  console.log(`  Total: ${despues.cantidad_total}, Disponible: ${despues.cantidad_disponible}, Danada: ${despues.cantidad_danada}`);

  console.log('\n=== MOVIMIENTOS DEL ITEM ===');
  const movRes = await fetch(`${BASE}/movimientos?inventario_id=${sierra.id}`, { headers });
  const movs = await movRes.json();
  movs.filter(m => m.prestamo_id === prestamoId || m.tipo === 'PERDIDO').forEach(m => {
    console.log(`  ${m.tipo} | Cant: ${m.cantidad} | ${(m.observaciones || '').substring(0, 60)}`);
  });

  console.log('\n=== TEST 2: MULTI-ITEM, REPORTAR SOLO UNO COMO PERDIDO ===\n');

  const itemsMulti = inventario.filter(i => i.cantidad_disponible >= 4 && !i.nombre.includes('Test')).slice(0, 2);
  if (itemsMulti.length >= 2) {
    const prestamoMultiRes = await fetch(`${BASE}/prestamos/lote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        persona_id: persona.id,
        instructor_id: persona.id,
        fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        observaciones: 'Multi-item para prueba de perdido',
        items: itemsMulti.map(i => ({ inventario_id: i.id, cantidad: 4 })),
      }),
    });
    const prestamoMulti = await prestamoMultiRes.json();
    const multiId = prestamoMulti.data?.id;
    console.log('Prestamo multi ID:', multiId);
    console.log('Detalles:', prestamoMulti.data?.detalles?.length);

    const itemAPerder = prestamoMulti.data.detalles[0];
    const invMulti1 = await fetch(`${BASE}/inventario/${itemAPerder.inventario_id}`, { headers });
    const multi1Antes = await invMulti1.json();
    console.log(`  ${multi1Antes.nombre} - Total: ${multi1Antes.cantidad_total}, Disponible: ${multi1Antes.cantidad_disponible}`);

    const perdidoMultiRes = await fetch(`${BASE}/prestamos/${multiId}/perdido`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        observaciones: 'Solo un item del prestamo se perdio',
        items_perdidos: [
          { inventario_id: itemAPerder.inventario_id, cantidad: 2, observaciones: 'No se encontro' },
        ],
      }),
    });
    const perdidoMultiData = await perdidoMultiRes.json();
    console.log('\nMulti perdido status:', perdidoMultiRes.status);
    console.log('Prestamo estado:', perdidoMultiData.estado);

    const invMulti1Despues = await fetch(`${BASE}/inventario/${itemAPerder.inventario_id}`, { headers });
    const multi1Despues = await invMulti1Despues.json();
    console.log(`  ${multi1Despues.nombre} - Total: ${multi1Despues.cantidad_total}, Disponible: ${multi1Despues.cantidad_disponible}`);

    if (perdidoMultiData.detalles) {
      console.log('\nDetalles del prestamo:');
      perdidoMultiData.detalles.forEach(d => {
        const inv = inventario.find(i => i.id === d.inventario_id);
        console.log(`  ${inv?.nombre}: perdida=${d.cantidad_perdida}, estado=${d.estado_devolucion}`);
      });
    }
  }
}

main().catch(e => console.error(e.message));
