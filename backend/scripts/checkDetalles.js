const { prisma } = require('../db');
(async () => {
  const detalles = await prisma.prestamoDetalle.findMany({
    where: {
      prestamo: {
        estado: 'PERDIDO'
      }
    },
    include: {
      inventario: { select: { nombre: true } }
    }
  });

  console.log('Detalles de prestamos PERDIDO:');
  detalles.forEach(d => {
    console.log(`\n  Item: ${d.inventario.nombre}`);
    console.log(`    Cantidad original: ${d.cantidad}`);
    console.log(`    Estado devolucion: ${d.estado_devolucion}`);
    console.log(`    Buena: ${d.cantidad_devuelta_buena}`);
    console.log(`    Danada: ${d.cantidad_devuelta_danada}`);
    console.log(`    Perdida: ${d.cantidad_perdida}`);
    console.log(`    Obs: ${(d.observaciones_devolucion || '').substring(0, 60)}`);
  });

  process.exit(0);
})();
