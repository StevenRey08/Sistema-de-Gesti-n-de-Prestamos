const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
// Esto obliga a buscar el .env en la misma carpeta donde está este db.js
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Agregamos este log para ver si por fin cargaron
console.log("Cargando usuario:", process.env.DB_USER || "NO ENCONTRADO");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = { pool, prisma };