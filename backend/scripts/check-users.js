require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  const users = await prisma.usuario.findMany({ select: { usuario: true, nombre: true, apellido: true } });
  console.log('Usuarios:', JSON.stringify(users));
  const roles = await prisma.role.findMany({ select: { nombre_rol: true, id: true } });
  console.log('Roles:', JSON.stringify(roles));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
