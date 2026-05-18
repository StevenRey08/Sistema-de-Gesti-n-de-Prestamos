require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const count = await prisma.personaHistorico.count();
  console.log('Registros en historico:', count);

  if (count > 0) {
    const records = await prisma.personaHistorico.findMany({ take: 5, orderBy: { fecha_baja: 'desc' } });
    console.log('Ultimos registros:', JSON.stringify(records, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
