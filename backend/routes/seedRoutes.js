const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seedController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.post('/reset', checkPermiso('USUARIOS', 'eliminar'), seedController.reset);
router.post('/seed', checkPermiso('USUARIOS', 'ingresar'), seedController.seed);

module.exports = router;
