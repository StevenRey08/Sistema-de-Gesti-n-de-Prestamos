require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  const adminRole = await prisma.role.findUnique({ where: { nombre_rol: 'ADMINISTRADOR' } });
  const perms = await prisma.permiso.findMany({
    where: { rol_id: adminRole.id },
    include: { modulo: true }
  });
  console.log('Permisos ADMIN:');
  for (const p of perms) {
    console.log(`  ${p.modulo.nombre}: leer=${p.leer} ingresar=${p.ingresar} actualizar=${p.actualizar} eliminar=${p.eliminar}`);
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
