const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

// Pool de pg para consultas SQL directas y para el adaptador de Prisma
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// En Prisma v7 se recomienda el uso de adaptadores para conexiones directas
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Verificar conexión al iniciar el servidor
prisma.$connect()
    .then(() => {
        console.log('✅ Conectado a la base de datos con Prisma');
    })
    .catch((err) => {
        console.error('❌ Error conectando a la base de datos con Prisma:', err.message);
        console.error('   Verifica que DATABASE_URL en .env sea correcta y que PostgreSQL esté corriendo.');
    });

module.exports = { prisma, pool };
