const { prisma } = require('../db');
(async () => {
  const item = await prisma.inventario.findFirst({
    where: { nombre: { contains: 'Calibrador' } }
  });

  console.log('Item:', item.nombre);
  console.log('Total:', item.cantidad_total, 'Disponible:', item.cantidad_disponible, 'Danada:', item.cantidad_danada);

  const movimientos = await prisma.movimiento.findMany({
    where: { inventario_id: item.id },
    orderBy: { fecha: 'asc' },
    select: { id: true, tipo: true, cantidad: true, observaciones: true, fecha: true }
  });

  console.log('\nMovimientos:');
  movimientos.forEach(m => {
    console.log(`  ${m.fecha?.toISOString().split('T')[0]} | ${m.tipo} | Cant: ${m.cantidad} | ${m.observaciones?.substring(0, 60)}`);
  });

  const prestamos = await prisma.prestamo.findMany({
    where: {
      OR: [
        { inventario_id: item.id },
        { detalles: { some: { inventario_id: item.id } } }
      ]
    },
    include: { detalles: { where: { inventario_id: item.id } } },
    orderBy: { fecha_prestamo: 'desc' }
  });

  console.log('\nPrestamos:');
  prestamos.forEach(p => {
    const det = p.detalles.find(d => d.inventario_id === item.id);
    console.log(`  ${p.id.substring(0, 8)} | ${p.estado} | Cant: ${p.cantidad} | Det: ${det?.cantidad || 'N/A'} | Obs: ${(p.observaciones || '').substring(0, 50)}`);
  });

  process.exit(0);
})();
