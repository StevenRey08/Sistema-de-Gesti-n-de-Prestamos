const express = require('express');
const router = express.Router();
const moduloController = require('../controllers/moduloController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('USUARIOS', 'leer'), moduloController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), moduloController.getById);
router.post('/', checkPermiso('USUARIOS', 'ingresar'), moduloController.create);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), moduloController.update);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), moduloController.delete);
router.post('/seed', checkPermiso('USUARIOS', 'ingresar'), moduloController.seedDefaultModules);

module.exports = router;
