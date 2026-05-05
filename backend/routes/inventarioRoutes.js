const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { validarInventario } = require('../middlewares/inventarioValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('Inventario', 'ingresar'), upload.single('imagen'), validarInventario, inventarioController.create);
router.put('/:id', checkPermiso('Inventario', 'actualizar'), upload.single('imagen'), validarInventario, inventarioController.update);

router.get('/', checkPermiso('Inventario', 'leer'), inventarioController.getAll);
router.get('/alertas', checkPermiso('Inventario', 'leer'), inventarioController.getAlertasStock);
router.get('/:id', checkPermiso('Inventario', 'leer'), inventarioController.getById);
router.delete('/:id', checkPermiso('Inventario', 'eliminar'), inventarioController.delete);

module.exports = router;