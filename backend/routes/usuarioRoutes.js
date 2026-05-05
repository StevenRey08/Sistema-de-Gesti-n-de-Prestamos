const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { validarUsuario } = require('../middlewares/usuarioValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

// Aplicar verificación de token a todas las rutas de este archivo
router.use(verificarToken);

// --- RUTAS DE ESCRITURA (Llevan el middleware de validación) ---
router.post('/', checkPermiso('USUARIOS', 'ingresar'), validarUsuario, usuarioController.create);
router.put('/:id', checkPermiso('USUARIOS', 'actualizar'), validarUsuario, usuarioController.update);

router.get('/', checkPermiso('USUARIOS', 'leer'), usuarioController.getAll);
router.get('/:id', checkPermiso('USUARIOS', 'leer'), usuarioController.getById);
router.delete('/:id', checkPermiso('USUARIOS', 'eliminar'), usuarioController.delete);

module.exports = router;