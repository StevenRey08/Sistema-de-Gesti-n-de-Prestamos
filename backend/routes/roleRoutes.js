const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { validarRole } = require('../middlewares/roleValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarRole, roleController.create);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarRole, roleController.update);

router.get('/', checkPermiso('USUARIOS', 'leer'), roleController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), roleController.getById);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), roleController.delete);

module.exports = router;