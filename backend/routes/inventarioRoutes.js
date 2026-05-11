const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validarInventario } = require('../middlewares/inventarioValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { upload, validarImagenSubida } = require('../middlewares/uploadMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('INVENTARIO', 'ingresar'), upload.single('imagen'), validarImagenSubida, validarInventario, inventarioController.create);
router.put('/:id', checkPermiso('INVENTARIO', 'actualizar'), upload.single('imagen'), validarImagenSubida, validarInventario, inventarioController.update);

router.get('/', checkPermiso('INVENTARIO', 'leer'), inventarioController.getAll);
router.get('/alertas', checkPermiso('INVENTARIO', 'leer'), inventarioController.getAlertasStock);
router.get('/:id', checkPermiso('INVENTARIO', 'leer'), inventarioController.getById);
router.delete('/:id', checkPermiso('INVENTARIO', 'eliminar'), inventarioController.delete);

module.exports = router;