const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const app = express();

// Importar rutas
const personaRoutes = require('./routes/personaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const prestamoRoutes = require('./routes/prestamoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const ubicacionRoutes = require('./routes/ubicacionRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/dashboard', dashboardRoutes);



// Manejo de errores global (incluyendo JSON malformado)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "JSON malformado" });
    }
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000; // Usamos el 4000 para no chocar con el frontend
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});