const express = require('express');
const router = express.Router();
const reportesSeguridadController = require('../controllers/reportesSeguridadController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/dashboard', checkPermiso('USUARIOS', 'leer'), reportesSeguridadController.getDashboard);
router.get('/actividad/:usuario_id', checkPermiso('USUARIOS', 'leer'), reportesSeguridadController.getActividadUsuario);
router.get('/usuarios-riesgo', checkPermiso('USUARIOS', 'leer'), reportesSeguridadController.getUsuariosRiesgo);
router.post('/reset-intentos/:usuario_id', checkPermiso('USUARIOS', 'actualizar'), reportesSeguridadController.resetIntentosFallidos);

module.exports = router;
