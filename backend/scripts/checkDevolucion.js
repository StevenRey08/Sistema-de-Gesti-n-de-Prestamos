const { prisma } = require('../db');
(async () => {
  const inv = await prisma.inventario.findMany({
    where: { nombre: { contains: 'Sierra Circular' } },
    select: { id: true, nombre: true, cantidad_total: true, cantidad_disponible: true, cantidad_danada: true }
  });
  console.log('Inventario Sierra Circular:', inv);

  const movs = await prisma.movimiento.findMany({
    where: { tipo: 'DEVUELTO_DANADO' },
    select: { id: true, tipo: true, cantidad: true, observaciones: true }
  });
  console.log('\nMovimientos DEVUELTO_DANADO:', movs);

  const pres = await prisma.prestamo.findMany({
    select: { id: true, estado: true, observaciones: true },
    take: 12,
    orderBy: { fecha_prestamo: 'desc' }
  });
  console.log('\nPrestamos (ultimos 12):');
  pres.forEach(p => console.log(`  ${p.id.substring(0,8)} - ${p.estado} - ${(p.observaciones || '').substring(0,60)}`));

  process.exit(0);
})();
