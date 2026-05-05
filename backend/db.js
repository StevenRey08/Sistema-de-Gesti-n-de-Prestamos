const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config();

// Instancia de Prisma para la mayoría de las operaciones
const prisma = new PrismaClient();

// Instancia de Pool (pg) por si necesitas hacer consultas SQL directas
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Probar conexión de Prisma al iniciar
prisma.$connect()
    .then(() => {
        console.log("✅ Conectado a la base de datos con Prisma");
    })
    .catch((err) => {
        console.error("❌ Error conectando a la base de datos con Prisma:", err.message);
    });

module.exports = {
    prisma,
    pool
};
