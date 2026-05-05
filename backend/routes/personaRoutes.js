const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { validarPersona } = require('../middlewares/personaValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/', checkPermiso('PERSONAS', 'ingresar'), validarPersona, personaController.create);
router.put('/:id', checkPermiso('PERSONAS', 'actualizar'), validarPersona, personaController.update);
router.get('/', checkPermiso('PERSONAS', 'leer'), personaController.getAll);
router.get('/:id', checkPermiso('PERSONAS', 'leer'), personaController.getById);
router.delete('/:id', checkPermiso('PERSONAS', 'eliminar'), personaController.delete);

module.exports = router;