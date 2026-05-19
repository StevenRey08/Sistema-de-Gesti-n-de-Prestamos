const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validarInventario } = require('../middlewares/inventarioValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('INVENTARIO', 'ingresar'), upload.single('imagen'), validarInventario, logAuditoriaDetalle('INVENTARIO', 'CREAR', (req, res) => `Creó item: ${req.body.nombre}`), inventarioController.create);
router.put('/:id', checkPermiso('INVENTARIO', 'actualizar'), upload.single('imagen'), validarInventario, logAuditoriaDetalle('INVENTARIO', 'ACTUALIZAR', (req, res) => `Actualizó item: ${req.params.id}`), inventarioController.update);

router.get('/', checkPermiso('INVENTARIO', 'leer'), inventarioController.getAll);
router.get('/:id', checkPermiso('INVENTARIO', 'leer'), inventarioController.getById);
router.post('/salida', checkPermiso('INVENTARIO', 'eliminar'), logAuditoria('INVENTARIO', 'SALIDA'), inventarioController.registrarSalida);
router.delete('/:id', checkPermiso('INVENTARIO', 'eliminar'), logAuditoriaDetalle('INVENTARIO', 'ELIMINAR', (req, res) => `Eliminó item: ${req.params.id}`), inventarioController.delete);

module.exports = router;
