const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

console.log("--- Prueba de Conexión Final ---");

pool.query('SELECT NOW()')
    .then(res => {
        console.log("✅ ¡CONECTADO EXITOSAMENTE!");
        console.log("Servidor respondió a las:", res.rows[0].now);
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ ERROR AL CONSULTAR:", err.message);
        process.exit(1);
    });

