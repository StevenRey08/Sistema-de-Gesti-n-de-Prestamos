const { prisma } = require('../db');

(async () => {
  const pres = await prisma.prestamo.findMany({ orderBy: { fecha_prestamo: 'asc' } });

  // Devolver 5 prestamos (indices 5-9)
  for (let i = 5; i <= 9; i++) {
    const p = pres[i];
    const devDate = new Date(2026, 4, 18 + Math.floor(Math.random() * 60));
    await prisma.prestamo.update({
      where: { id: p.id },
      data: { estado: 'DEVUELTO', fecha_devolucion: devDate }
    });
    await prisma.inventario.update({
      where: { id: p.inventario_id },
      data: { cantidad_disponible: { increment: p.cantidad } }
    });
    console.log('Devuelto:', p.id.substring(0, 8), '->', p.estado, 'fecha_dev:', devDate.toISOString().split('T')[0]);
  }

  // Pendientes (indices 10-11)
  for (let i = 10; i <= 11; i++) {
    const p = pres[i];
    await prisma.prestamo.update({
      where: { id: p.id },
      data: { estado: 'PENDIENTE' }
    });
    console.log('Pendiente:', p.id.substring(0, 8));
  }

  const a = await prisma.prestamo.count({ where: { estado: 'ACTIVO' } });
  const d = await prisma.prestamo.count({ where: { estado: 'DEVUELTO' } });
  const pe = await prisma.prestamo.count({ where: { estado: 'PENDIENTE' } });
  console.log('\nTotales: ACTIVO:', a, '| DEVUELTO:', d, '| PENDIENTE:', pe);

  process.exit(0);
})();
