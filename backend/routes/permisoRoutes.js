const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { validarPermiso } = require('../middlewares/permisoValidar');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarPermiso, logAuditoria('PERMISOS', 'CREAR'), permisoController.create);
router.get('/', checkPermiso('USUARIOS', 'leer'), permisoController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), permisoController.getById);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarPermiso, logAuditoriaDetalle('PERMISOS', 'ACTUALIZAR', (req, res) => `Actualizó permiso: ${req.params.id}`), permisoController.update);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), logAuditoriaDetalle('PERMISOS', 'ELIMINAR', (req, res) => `Eliminó permiso: ${req.params.id}`), permisoController.delete);

module.exports = router;