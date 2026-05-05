const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { validarPermiso } = require('../middlewares/permisoValidar');

router.use(verificarToken);

router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarPermiso, permisoController.create);
router.get('/', checkPermiso('USUARIOS', 'leer'), permisoController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), permisoController.getById);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarPermiso, permisoController.update);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), permisoController.delete);

module.exports = router;