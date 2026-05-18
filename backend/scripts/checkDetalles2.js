const { prisma } = require('../db');
(async () => {
  const pres = await prisma.prestamo.findMany({
    where: { estado: 'DEVUELTO' },
    include: { detalles: true, inventario: { select: { nombre: true } } },
    orderBy: { fecha_devolucion: 'desc' },
    take: 5
  });

  console.log('Prestamos DEVUELTO (ultimos 5):');
  pres.forEach(p => {
    console.log(`\n  ID: ${p.id.substring(0, 8)}`);
    console.log(`  Estado: ${p.estado}`);
    console.log(`  Inventario: ${p.inventario?.nombre || 'N/A'}`);
    console.log(`  Detalles: ${p.detalles.length}`);
    p.detalles.forEach(d => {
      console.log(`    - Item: ${d.inventario_id?.substring(0, 8) || 'N/A'}`);
      console.log(`      Cant: ${d.cantidad}`);
      console.log(`      Estado dev: ${d.estado_devolucion || 'N/A'}`);
      console.log(`      Buena: ${d.cantidad_devuelta_buena}`);
      console.log(`      Danada: ${d.cantidad_devuelta_danada}`);
      console.log(`      Perdida: ${d.cantidad_perdida}`);
    });
  });

  process.exit(0);
})();
