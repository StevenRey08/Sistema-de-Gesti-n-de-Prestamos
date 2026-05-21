const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: "error", mensaje: "Demasiados intentos. Intenta de nuevo en 15 minutos." }
});

router.post('/login', loginLimiter, authController.login);
router.post('/logout', verificarToken, authController.logout);
router.get('/me', verificarToken, authController.me);
router.put('/me', verificarToken, authController.actualizarPerfil);

router.post('/solicitar-codigo', authController.solicitarCodigoReset);
router.post('/verificar-codigo', authController.verificarCodigoReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
