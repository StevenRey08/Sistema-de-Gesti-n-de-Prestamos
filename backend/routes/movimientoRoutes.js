const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');
const { validarMovimiento } = require('../middlewares/movimientoValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('MOVIMIENTOS', 'ingresar'), validarMovimiento, movimientoController.create);
router.get('/', checkPermiso('MOVIMIENTOS', 'leer'), movimientoController.getAll);
router.get('/:id', checkPermiso('MOVIMIENTOS', 'leer'), movimientoController.getById);
router.delete('/:id', movimientoController.delete);

module.exports = router;