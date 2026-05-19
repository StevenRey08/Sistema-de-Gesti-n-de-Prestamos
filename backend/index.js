const express = require('express');
require('dotenv').config();
const logger = require('./utils/logger');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const app = express();

// Validar variables de entorno críticas al inicio
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`ERROR FATAL: Faltan variables de entorno: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Importar middlewares
const { verificarToken } = require('./middlewares/authMiddleware');

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
const reportesRoutes = require('./routes/reportesRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const seedRoutes = require('./routes/seedRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const sesionRoutes = require('./routes/sesionRoutes');
const moduloRoutes = require('./routes/moduloRoutes');
const politicasRoutes = require('./routes/politicasRoutes');
const reportesSeguridadRoutes = require('./routes/reportesSeguridadRoutes');

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
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
app.use('/api/reportes', reportesRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/modulos', moduloRoutes);
app.use('/api/politicas', politicasRoutes);
app.use('/api/reportes-seguridad', reportesSeguridadRoutes);

// Manejo de errores global (incluyendo JSON malformado)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ status: "error", mensaje: "JSON malformado" });
    }
    logger.error("Error interno", { error: err.stack });
    res.status(500).json({ status: "error", mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000; // Usamos el 4000 para no chocar con el frontend
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});