const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verificarToken, authController.me);
router.put('/me', verificarToken, authController.actualizarPerfil);

router.post('/solicitar-codigo', authController.solicitarCodigoReset);
router.post('/verificar-codigo', authController.verificarCodigoReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
