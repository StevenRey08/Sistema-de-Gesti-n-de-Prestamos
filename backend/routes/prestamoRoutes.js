const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const { validarPrestamo, validarDevolucion } = require('../middlewares/prestamoValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getAll);
router.get('/pendientes', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getPendientes);
router.get('/:id', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getById);

router.post('/', checkPermiso('PRESTAMOS', 'ingresar'), validarPrestamo, prestamoController.create);
router.put('/:id', checkPermiso('PRESTAMOS', 'actualizar'), prestamoController.update);
router.patch('/:id/devolucion', checkPermiso('PRESTAMOS', 'actualizar'), validarDevolucion, prestamoController.registrarDevolucion);

router.delete('/:id', checkPermiso('PRESTAMOS', 'eliminar'), prestamoController.delete);

module.exports = router;