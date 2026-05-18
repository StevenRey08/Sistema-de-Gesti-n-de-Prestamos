const { prisma } = require('../db');
(async () => {
  const movs = await prisma.movimiento.findMany({
    where: { tipo: 'PERDIDO', prestamo_id: 'fb7abd74-e625-4a59-b1f5-c2008cd1887b' },
    select: { id: true, tipo: true, cantidad: true, prestamo_id: true }
  });
  console.log('Movimientos PERDIDO para prestamo fb7abd74:');
  movs.forEach(m => console.log(`  ID: ${m.id.substring(0,8)}, Cant: ${m.cantidad}, PrestamoID: ${m.prestamo_id?.substring(0,8)}`));

  const prestamo = await prisma.prestamo.findUnique({
    where: { id: 'fb7abd74-e625-4a59-b1f5-c2008cd1887b' },
    select: { id: true, estado: true, cantidad: true, observaciones: true }
  });
  console.log('\nPrestamo:', prestamo);

  process.exit(0);
})();
