require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  console.log('✅ Conectado');

  const mod = await prisma.modulo.upsert({
    where: { nombre: 'REPORTES' },
    update: { descripcion: 'Reportes y estadísticas', ruta: '/reportes', icono: 'chart-bar', orden: 9 },
    create: { nombre: 'REPORTES', descripcion: 'Reportes y estadísticas', ruta: '/reportes', icono: 'chart-bar', orden: 9 }
  });
  console.log('Módulo REPORTES:', mod.id, 'activo:', mod.activo);

  const allRoles = await prisma.role.findMany();
  console.log('Roles encontrados:', allRoles.length, allRoles.map(r => r.nombre_rol));

  for (const role of allRoles) {
    await prisma.permiso.upsert({
      where: { rol_id_modulo_id: { rol_id: role.id, modulo_id: mod.id } },
      update: {},
      create: { rol_id: role.id, modulo_id: mod.id, leer: true, ingresar: true, actualizar: true, eliminar: true }
    });
    console.log(`Permiso REPORTES creado para rol: ${role.nombre_rol}`);
  }

  await prisma.$disconnect();
  console.log('✅ Listo');
}

main().catch(e => { console.error(e); process.exit(1); });
