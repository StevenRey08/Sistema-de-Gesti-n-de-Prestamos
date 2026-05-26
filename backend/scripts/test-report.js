require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  try {
    // Simulate what masPrestados does
    const resultados = await prisma.prestamo.groupBy({
      by: ['inventario_id'],
      _count: { id: true },
      _sum: { cantidad: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const ids = resultados.map(r => r.inventario_id);
    console.log('IDs:', JSON.stringify(ids));

    const inventarios = await prisma.inventario.findMany({
      where: { id: { in: ids } },
      include: { categoria: true }
    });
    console.log('Inventarios count:', inventarios.length);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack?.substring(0, 800));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
