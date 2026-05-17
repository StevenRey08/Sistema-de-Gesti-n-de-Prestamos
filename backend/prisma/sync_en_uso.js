const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Sincronizando en_uso y disponibles...\n');

    const items = await prisma.inventario.findMany({
        include: {
            prestamos: {
                where: { estado: 'ACTIVO' },
                select: { cantidad: true }
            }
        }
    });

    for (const item of items) {
        const enUsoReal = item.prestamos.reduce((sum, p) => sum + p.cantidad, 0);
        const disponibleCalculado = item.cantidad_total - item.cantidad_danada - enUsoReal;

        if (item.en_uso !== enUsoReal || item.cantidad_disponible !== disponibleCalculado) {
            await prisma.inventario.update({
                where: { id: item.id },
                data: {
                    en_uso: enUsoReal,
                    cantidad_disponible: disponibleCalculado,
                }
            });
            console.log(`  ${item.codigo}: en_uso ${item.en_uso}→${enUsoReal}, disponible ${item.cantidad_disponible}→${disponibleCalculado}`);
        }
    }

    console.log(`\n✅ Sincronización completada (${items.length} artículos)`);
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
