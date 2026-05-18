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

  console.log('=== TEST DEVOLUCION CON ESTADOS POR ITEM ===\n');

  const prestamosRes = await fetch(`${BASE}/prestamos?estado=ACTIVO`, { headers });
  const prestamos = await prestamosRes.json();
  console.log('Prestamos activos:', prestamos.length);

  if (prestamos.length > 0) {
    const p = prestamos[0];
    console.log('\nPrestamo:', p.id.substring(0, 8));
    console.log('  Estudiante:', p.persona?.nombres);
    console.log('  Inventario:', p.inventario?.nombre || 'Multi-item');

    const esMulti = p.detalles && p.detalles.length > 0;
    const items = esMulti ? p.detalles.map(d => ({
      inventario_id: d.inventario_id,
      estado: d.inventario?.nombre?.includes('Sierra') ? 'BUEN_ESTADO' : 'MAL_ESTADO',
      observaciones: `Devolucion de prueba para ${d.inventario?.nombre || 'item'}`,
    })) : [{
      inventario_id: p.inventario_id,
      estado: 'PERDIDO',
      observaciones: 'Prueba item perdido',
    }];

    console.log('\nEnviando devolucion con items:', JSON.stringify(items, null, 2));

    const devRes = await fetch(`${BASE}/prestamos/${p.id}/devolucion`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        observaciones_dev: 'Devolucion de prueba con estados mixtos',
        items_devolucion: items,
      }),
    });
    const devData = await devRes.json();
    console.log('\nResponse status:', devRes.status);
    console.log('Response:', JSON.stringify(devData, null, 2).substring(0, 500));

    if (devData.detalles) {
      console.log('\nDetalles actualizados:');
      devData.detalles.forEach(d => {
        console.log(`  Item: ${d.inventario_id.substring(0, 8)}`);
        console.log(`    Estado: ${d.estado_devolucion}`);
        console.log(`    Buena: ${d.cantidad_devuelta_buena}, Danada: ${d.cantidad_devuelta_danada}, Perdida: ${d.cantidad_perdida}`);
        console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 50)}`);
      });
    }
  } else {
    console.log('No hay prestamos activos para probar');
  }
}

main().catch(e => console.error(e.message));
