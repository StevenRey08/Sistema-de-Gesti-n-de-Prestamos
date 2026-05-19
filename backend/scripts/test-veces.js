require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const r = await prisma.prestamo.findFirst({
    include: {
      inventario: { include: { categoria: true } },
      detalles: { include: { inventario: { include: { categoria: true } } } }
    }
  });
  if (!r) { console.log('No hay prestamos'); return; }
  console.log('veces_impreso:', r.veces_impreso);
  await prisma.prestamo.update({
    where: { id: r.id },
    data: { veces_impreso: { increment: 1 } }
  });
  const r2 = await prisma.prestamo.findUnique({ where: { id: r.id } });
  console.log('nuevo valor:', r2.veces_impreso);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
