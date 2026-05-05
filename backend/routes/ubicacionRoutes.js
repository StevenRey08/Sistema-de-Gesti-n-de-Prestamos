const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');
const { validarUbicacion } = require('../middlewares/ubicacionValidar'); // Tu middleware de validación
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

// Rutas de escritura (Protegidas por el validador)
router.post('/', checkPermiso('INVENTARIO', 'ingresar'), validarUbicacion, ubicacionController.create);
router.put('/:id', checkPermiso('INVENTARIO', 'actualizar'), validarUbicacion, ubicacionController.update);

// Rutas de lectura y eliminación
router.get('/', checkPermiso('INVENTARIO', 'leer'), ubicacionController.getAll);
router.get('/:id', checkPermiso('INVENTARIO', 'leer'), ubicacionController.getById);
router.delete('/:id', checkPermiso('INVENTARIO', 'eliminar'), ubicacionController.delete);

module.exports = router;