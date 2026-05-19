const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('USUARIOS', 'leer'), auditoriaController.getAll);
router.get('/stats', checkPermiso('USUARIOS', 'leer'), auditoriaController.getStats);
router.get('/export', checkPermiso('USUARIOS', 'leer'), auditoriaController.exportLogs);
router.post('/clean', checkPermiso('USUARIOS', 'eliminar'), auditoriaController.cleanOldLogs);

module.exports = router;
