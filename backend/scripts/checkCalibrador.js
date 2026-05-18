const { prisma } = require('../db');
(async () => {
  const items = await prisma.inventario.findMany({
    where: { nombre: { contains: 'Calibrador' } },
    select: {
      id: true, nombre: true, codigo: true,
      cantidad_total: true, cantidad_disponible: true, cantidad_danada: true
    }
  });

  console.log('Inventario items:');
  for (const item of items) {
    const prestadoCalc = item.cantidad_total - item.cantidad_disponible - item.cantidad_danada;
    console.log(`\n  ${item.nombre}`);
    console.log(`    Total: ${item.cantidad_total}, Disponible: ${item.cantidad_disponible}, Danada: ${item.cantidad_danada}`);
    console.log(`    Calculo prestado: ${prestadoCalc}`);

    const prestamosActivos = await prisma.prestamo.count({
      where: {
        estado: { in: ['ACTIVO', 'VENCIDO'] },
        OR: [
          { inventario_id: item.id },
          { detalles: { some: { inventario_id: item.id } } }
        ]
      }
    });

    const cantidadEnPrestamos = await prisma.prestamo.aggregate({
      where: {
        estado: { in: ['ACTIVO', 'VENCIDO'] },
        OR: [
          { inventario_id: item.id },
          { detalles: { some: { inventario_id: item.id } } }
        ]
      },
      _sum: { cantidad: true }
    });

    const detallesActivos = await prisma.prestamoDetalle.findMany({
      where: {
        inventario_id: item.id,
        prestamo: { estado: { in: ['ACTIVO', 'VENCIDO'] } }
      },
      select: { cantidad: true, prestamo: { select: { id: true, estado: true } } }
    });

    const totalEnDetalles = detallesActivos.reduce((s, d) => s + d.cantidad, 0);

    console.log(`    Prestamos activos: ${prestamosActivos}`);
    console.log(`    Cantidad en prestamos (directo): ${cantidadEnPrestamos._sum.cantidad || 0}`);
    console.log(`    Cantidad en detalles: ${totalEnDetalles}`);
  }

  process.exit(0);
})();
