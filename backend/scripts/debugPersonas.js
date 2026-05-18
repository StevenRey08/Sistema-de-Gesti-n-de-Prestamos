const { prisma } = require('../db');

(async () => {
  try {
    const where = { AND: [] };
    where.AND.push({ activo: true });
    if (where.AND.length === 0) delete where.AND;

    console.log('Where:', JSON.stringify(where));

    const personas = await prisma.persona.findMany({
      where,
      include: {
        _count: {
          select: {
            prestamos_estudiante: {
              where: { estado: { in: ['ACTIVO', 'PENDIENTE', 'VENCIDO'] } }
            },
            prestamos_instructor: {
              where: { estado: { in: ['ACTIVO', 'PENDIENTE', 'VENCIDO'] } }
            }
          }
        }
      },
      orderBy: { nombres: 'asc' }
    });

    const resultado = personas.map(p => ({
      ...p,
      prestamosActivos: p._count.prestamos_estudiante + p._count.prestamos_instructor
    }));

    console.log('Personas encontradas:', resultado.length);
    resultado.forEach(p => {
      console.log(`  ${p.matricula} - ${p.nombres} ${p.apellidos} (${p.tipo}) - prestamos: ${p.prestamosActivos}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Full:', error);
    process.exit(1);
  }
})();
