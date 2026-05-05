const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { validarCategoria } = require('../middlewares/categoriaValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('INVENTARIO', 'ingresar'), validarCategoria, categoriaController.create);
router.get('/', checkPermiso('INVENTARIO', 'leer'), categoriaController.getAll);
router.get('/:id', checkPermiso('INVENTARIO', 'leer'), categoriaController.getById);
router.put('/:id', checkPermiso('INVENTARIO', 'actualizar'), validarCategoria, categoriaController.update);
router.delete('/:id', checkPermiso('INVENTARIO', 'eliminar'), categoriaController.delete);

module.exports = router;
