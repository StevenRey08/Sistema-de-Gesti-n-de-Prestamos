const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validarUsuario } = require('../middlewares/usuarioValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarUsuario, logAuditoriaDetalle('USUARIOS', 'CREAR', (req, res) => `Creó usuario: ${req.body.usuario}`), usuarioController.create);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarUsuario, logAuditoriaDetalle('USUARIOS', 'ACTUALIZAR', (req, res) => `Actualizó usuario: ${req.params.id}`), usuarioController.update);

router.get('/', checkPermiso('USUARIOS', 'leer'), usuarioController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), usuarioController.getById);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), logAuditoriaDetalle('USUARIOS', 'ELIMINAR', (req, res) => `Eliminó usuario: ${req.params.id}`), usuarioController.delete);

module.exports = router;