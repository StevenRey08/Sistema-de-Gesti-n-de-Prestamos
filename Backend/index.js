const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Importar rutas
const proveedorRoutes = require('./routes/proveedorRoutes');
const personaRoutes = require('./routes/personaRoutes');


// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/personas', personaRoutes);


// Ruta de prueba para ver si funciona
app.get('/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ mensaje: "Conexión exitosa", hora: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4000; // Usamos el 4000 para no chocar con el frontend
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});