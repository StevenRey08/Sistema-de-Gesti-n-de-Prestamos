const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('INVENTARIO', 'leer'), pedidoController.getAll);
router.get('/:id', checkPermiso('INVENTARIO', 'leer'), pedidoController.getById);
router.post('/', checkPermiso('INVENTARIO', 'ingresar'), pedidoController.create);
router.put('/:id', checkPermiso('INVENTARIO', 'actualizar'), pedidoController.update);
router.patch('/:id/recibir', checkPermiso('INVENTARIO', 'actualizar'), pedidoController.recibirPedido);
router.delete('/:id', checkPermiso('INVENTARIO', 'eliminar'), pedidoController.delete);

module.exports = router;
