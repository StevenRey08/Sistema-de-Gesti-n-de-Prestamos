const { prisma } = require('../db');
(async () => {
  const p = await prisma.prestamo.findUnique({
    where: { id: '0fd31695-0000-0000-0000-000000000000' },
    include: { detalles: true, inventario: { select: { nombre: true } } }
  });

  const p2 = await prisma.prestamo.findFirst({
    where: { observaciones: { contains: 'Devolucion multi-item' } },
    include: { detalles: { include: { inventario: { select: { nombre: true } } } } }
  });

  if (p2) {
    console.log('Prestamo multi-item encontrado:');
    console.log(`  ID: ${p2.id.substring(0, 8)}`);
    console.log(`  Estado: ${p2.estado}`);
    console.log(`  Observaciones: ${p2.observaciones?.substring(0, 100)}`);
    console.log(`  Detalles: ${p2.detalles.length}`);
    p2.detalles.forEach(d => {
      console.log(`\n    Item: ${d.inventario.nombre}`);
      console.log(`    Cant original: ${d.cantidad}`);
      console.log(`    Estado dev: ${d.estado_devolucion}`);
      console.log(`    Buena: ${d.cantidad_devuelta_buena}`);
      console.log(`    Danada: ${d.cantidad_devuelta_danada}`);
      console.log(`    Perdida: ${d.cantidad_perdida}`);
      console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 60)}`);
    });
  } else {
    console.log('No se encontro prestamo multi-item');
  }

  process.exit(0);
})();
