const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
(async () => {
  try {
    const r = await prisma.inventario.findMany({
      include: { categoria: true, ubicaciones: { include: { padre: true } } },
      orderBy: { nombre: 'asc' }
    });
    console.log('SUCCESS items:', r.length);
    if (r.length > 0) console.log('First:', r[0].codigo, r[0].nombre, r[0].cantidad, r[0].estado);
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  await prisma.$disconnect();
})();
