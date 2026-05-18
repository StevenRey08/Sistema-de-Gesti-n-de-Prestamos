const { prisma } = require('../db');
(async () => {
  const p = await prisma.prestamo.findFirst({
    where: { observaciones: { contains: 'Devolucion de prueba' } },
    include: { detalles: true, inventario: { select: { nombre: true } } }
  });

  if (p) {
    console.log('Prestamo encontrado:');
    console.log(`  ID: ${p.id.substring(0, 8)}`);
    console.log(`  Estado: ${p.estado}`);
    console.log(`  Inventario: ${p.inventario?.nombre}`);
    console.log(`  Detalles: ${p.detalles.length}`);
    console.log(`  Observaciones: ${p.observaciones?.substring(0, 100)}`);
  } else {
    console.log('No se encontro prestamo con esa observacion');
  }

  process.exit(0);
})();
