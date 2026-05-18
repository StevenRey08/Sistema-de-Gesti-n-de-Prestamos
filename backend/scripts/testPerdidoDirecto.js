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

  const personasRes = await fetch(`${BASE}/personas?tipo=ESTUDIANTE`, { headers });
  const personas = await personasRes.json();
  const persona = personas[0];

  const invRes = await fetch(`${BASE}/inventario`, { headers });
  const inventario = await invRes.json();
  const item = inventario.find(i => i.cantidad_disponible >= 5 && !i.nombre.includes('Test'));

  console.log('Item:', item.nombre, `Total: ${item.cantidad_total}, Disponible: ${item.cantidad_disponible}`);

  console.log('\n=== CREAR PRESTAMO DIRECTO x5 ===');
  const prestamoRes = await fetch(`${BASE}/prestamos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inventario_id: item.id,
      persona_id: persona.id,
      instructor_id: persona.id,
      cantidad: 5,
      fecha_devolucion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      observaciones: 'Prestamo directo para prueba de perdido',
    }),
  });
  const prestamo = await prestamoRes.json();
  const prestamoId = prestamo.data?.id;
  console.log('Prestamo ID:', prestamoId);

  const invAntes = await fetch(`${BASE}/inventario/${item.id}`, { headers });
  const antes = await invAntes.json();
  console.log(`Antes - Total: ${antes.cantidad_total}, Disponible: ${antes.cantidad_disponible}`);

  console.log('\n=== REPORTAR 3 DE 5 COMO PERDIDO ===');
  const perdidoRes = await fetch(`${BASE}/prestamos/${prestamoId}/perdido`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      observaciones: 'Se perdieron 3 unidades',
      items_perdidos: [
        { inventario_id: item.id, cantidad: 3, observaciones: 'No aparecen en el taller' },
      ],
    }),
  });
  const perdidoData = await perdidoRes.json();
  console.log('Status:', perdidoRes.status);
  console.log('Prestamo estado:', perdidoData.estado);

  const invDespues = await fetch(`${BASE}/inventario/${item.id}`, { headers });
  const despues = await invDespues.json();
  console.log(`Despues - Total: ${despues.cantidad_total}, Disponible: ${despues.cantidad_disponible}`);
  console.log(`Esperado total: ${antes.cantidad_total - 3}`);

  console.log('\n=== REPORTAR 2 RESTANTES COMO PERDIDO (completar) ===');
  const perdido2Res = await fetch(`${BASE}/prestamos/${prestamoId}/perdido`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      observaciones: 'Se perdieron las 2 restantes',
      items_perdidos: [
        { inventario_id: item.id, cantidad: 2, observaciones: 'Restantes perdidos' },
      ],
    }),
  });
  const perdido2Data = await perdido2Res.json();
  console.log('Status:', perdido2Res.status);
  console.log('Prestamo estado:', perdido2Data.estado);

  const invFinal = await fetch(`${BASE}/inventario/${item.id}`, { headers });
  const final = await invFinal.json();
  console.log(`Final - Total: ${final.cantidad_total}, Disponible: ${final.cantidad_disponible}`);

  console.log('\nMovimientos PERDIDO:');
  const movRes = await fetch(`${BASE}/movimientos?inventario_id=${item.id}`, { headers });
  const movs = await movRes.json();
  movs.filter(m => m.tipo === 'PERDIDO').forEach(m => {
    console.log(`  Cant: ${m.cantidad} | ${(m.observaciones || '').substring(0, 60)}`);
  });
}

main().catch(e => console.error(e.message));
