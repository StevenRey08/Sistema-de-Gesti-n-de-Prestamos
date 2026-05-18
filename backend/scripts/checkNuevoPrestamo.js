const { prisma } = require('../db');
(async () => {
  const p = await prisma.prestamo.findUnique({
    where: { id: '823cbfe8-4674-4df9-ae89-0c522d1e14a5' },
    include: { detalles: { include: { inventario: { select: { nombre: true } } } } }
  });

  if (p) {
    console.log('Prestamo multi-item nuevo:');
    console.log(`  ID: ${p.id.substring(0, 8)}`);
    console.log(`  Estado: ${p.estado}`);
    console.log(`  Detalles: ${p.detalles.length}`);
    p.detalles.forEach(d => {
      console.log(`\n    Item: ${d.inventario.nombre}`);
      console.log(`    Cant original: ${d.cantidad}`);
      console.log(`    Estado dev: ${d.estado_devolucion}`);
      console.log(`    Buena: ${d.cantidad_devuelta_buena}`);
      console.log(`    Danada: ${d.cantidad_devuelta_danada}`);
      console.log(`    Perdida: ${d.cantidad_perdida}`);
      console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 60)}`);
    });
  } else {
    console.log('No se encontro prestamo');
  }

  process.exit(0);
})();
