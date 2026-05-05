const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const { validarPrestamo, validarDevolucion } = require('../middlewares/prestamoValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('Prestamos', 'leer'), prestamoController.getAll);
router.get('/pendientes', checkPermiso('Prestamos', 'leer'), prestamoController.getPendientes);
router.get('/:id', checkPermiso('Prestamos', 'leer'), prestamoController.getById);

router.post('/', checkPermiso('Prestamos', 'ingresar'), validarPrestamo, prestamoController.create);
router.patch('/:id/devolucion', checkPermiso('Prestamos', 'actualizar'), validarDevolucion, prestamoController.registrarDevolucion);

router.delete('/:id', checkPermiso('Prestamos', 'eliminar'), prestamoController.delete);

module.exports = router;