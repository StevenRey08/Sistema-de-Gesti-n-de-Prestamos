require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const admin = await prisma.usuario.findUnique({
    where: { usuario: 'admin' },
    include: { rol: { include: { permisos: { include: { modulo: true } } } } }
  });
  if (!admin) {
    console.log('No se encontro el usuario admin');
    return;
  }
  console.log('Usuario encontrado:');
  console.log('  Nombre:', admin.nombre, admin.apellido);
  console.log('  Usuario:', admin.usuario);
  console.log('  Rol:', admin.rol?.nombre_rol);
  console.log('  Activo:', admin.activo);
  console.log('');
  console.log('Permisos del rol', admin.rol?.nombre_rol + ':');
  for (const p of admin.rol?.permisos || []) {
    console.log('  ' + p.modulo?.nombre + ' -> leer: ' + p.leer + ' | ingresar: ' + p.ingresar + ' | actualizar: ' + p.actualizar + ' | eliminar: ' + p.eliminar);
  }
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
