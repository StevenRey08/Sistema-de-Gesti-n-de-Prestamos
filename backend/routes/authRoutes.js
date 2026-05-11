const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Ruta para el inicio de sesión
router.post('/login', authController.login);

// Cerrar sesión (limpiar cookie)
router.post('/logout', authController.logout);

// Verificar sesión actual (restaurar desde cookie)
router.get('/me', verificarToken, authController.me);

module.exports = router;
