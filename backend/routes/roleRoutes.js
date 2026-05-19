const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { validarRole } = require('../middlewares/roleValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarRole, logAuditoriaDetalle('ROLES', 'CREAR', (req, res) => `Creó rol: ${req.body.nombre_rol}`), roleController.create);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarRole, logAuditoriaDetalle('ROLES', 'ACTUALIZAR', (req, res) => `Actualizó rol: ${req.params.id}`), roleController.update);

router.get('/', checkPermiso('USUARIOS', 'leer'), roleController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), roleController.getById);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), logAuditoriaDetalle('ROLES', 'ELIMINAR', (req, res) => `Eliminó rol: ${req.params.id}`), roleController.delete);

module.exports = router;