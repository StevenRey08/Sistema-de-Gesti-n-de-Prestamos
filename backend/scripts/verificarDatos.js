const { prisma } = require('../db');
(async () => {
  console.log('=== VERIFICACIÓN FINAL ===');
  console.log('Ubicaciones:', await prisma.ubicacion.count());
  console.log('Categorías:', await prisma.categoriaHerramienta.count());
  console.log('Inventario:', await prisma.inventario.count());
  console.log('Personas:', await prisma.persona.count());
  console.log('  Docentes:', await prisma.persona.count({ where: { tipo: { in: ['PROFESOR', 'TECNICO', 'ADMINISTRATIVO'] } } }));
  console.log('  Estudiantes:', await prisma.persona.count({ where: { tipo: 'ESTUDIANTE' } }));
  console.log('Préstamos:', await prisma.prestamo.count());
  console.log('  Activos:', await prisma.prestamo.count({ where: { estado: 'ACTIVO' } }));
  console.log('  Devueltos:', await prisma.prestamo.count({ where: { estado: 'DEVUELTO' } }));
  console.log('  Pendientes:', await prisma.prestamo.count({ where: { estado: 'PENDIENTE' } }));
  console.log('Movimientos:', await prisma.movimiento.count());
  console.log('  Sin ubicacion:', await prisma.movimiento.count({ where: { OR: [{ ubicacion_origen_id: null }, { ubicacion_destino_id: null }] } }));
  console.log('  Prestamos sin instructor:', await prisma.prestamo.count({ where: { instructor_id: null } }));
  console.log('Usuarios:', await prisma.usuario.count());
  console.log('========================');

  const devs = await prisma.prestamo.findMany({ where: { estado: 'DEVUELTO' }, select: { fecha_devolucion: true, fecha_prestamo: true } });
  console.log('\nFechas de devolucion (todos deben ser posteriores a 17 mayo 2026):');
  devs.forEach(d => {
    const prest = d.fecha_prestamo ? d.fecha_prestamo.toISOString().split('T')[0] : 'N/A';
    const dev = d.fecha_devolucion ? d.fecha_devolucion.toISOString().split('T')[0] : 'SIN FECHA';
    console.log('  Prestamo:', prest, '-> Devolucion:', dev);
  });

  process.exit(0);
})();
