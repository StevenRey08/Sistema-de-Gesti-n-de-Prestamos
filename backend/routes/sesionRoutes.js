const express = require('express');
const router = express.Router();
const sesionController = require('../controllers/sesionController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('USUARIOS', 'leer'), sesionController.getAll);
router.get('/mis-sesiones', sesionController.getByCurrentUser);
router.post('/clean', checkPermiso('USUARIOS', 'eliminar'), sesionController.cleanExpired);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), sesionController.revoke);
router.post('/revoke-all/:usuario_id', checkPermiso('USUARIOS', 'actualizar'), sesionController.revokeAllByUser);

module.exports = router;
