const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends({
    query: {
        role: {
            async delete({ args, query }) {
                const role = await basePrisma.role.findUnique({ where: args.where });
                if (role && role.protegido) {
                    throw new Error('No se puede eliminar un rol protegido');
                }
                return query(args);
            },
        },
    },
});

basePrisma.$connect()
    .then(() => {
        console.log('✅ Conectado a la base de datos con Prisma');
    })
    .catch((err) => {
        console.error('❌ Error conectando a la base de datos con Prisma:', err.message);
        console.error('   Verifica que DATABASE_URL en .env sea correcta y que PostgreSQL esté corriendo.');
    });

module.exports = { prisma, pool };
