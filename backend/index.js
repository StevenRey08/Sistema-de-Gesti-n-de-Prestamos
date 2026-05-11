const express = require('express');
const logger = require('./utils/logger');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');
const app = express();

// Validar variables de entorno críticas al inicio
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`ERROR FATAL: Faltan variables de entorno: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Rate limiting global para toda la API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { status: "error", mensaje: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit más estricto para login (se aplica en la ruta)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { status: "error", mensaje: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

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

// Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', verificarToken, express.static('uploads'));

// Rutas
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
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
        return res.status(400).json({ status: "error", mensaje: "JSON malformado" });
    }
    logger.error("Error interno", { error: err.stack });
    res.status(500).json({ status: "error", mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000; // Usamos el 4000 para no chocar con el frontend
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});