const express = require('express');
const router = express.Router();
const politicasController = require('../controllers/politicasController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('USUARIOS', 'leer'), politicasController.getAll);
router.get('/:clave', checkPermiso('USUARIOS', 'leer'), politicasController.getByKey);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), politicasController.update);
router.post('/seed', checkPermiso('USUARIOS', 'ingresar'), politicasController.seedDefaultPolicies);

module.exports = router;
