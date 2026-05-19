const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/bajo-stock', checkPermiso('INVENTARIO', 'leer'), reportesController.bajoStock);
router.get('/mas-prestados', checkPermiso('PRESTAMOS', 'leer'), reportesController.masPrestados);
router.get('/menos-prestados', checkPermiso('PRESTAMOS', 'leer'), reportesController.menosPrestados);
router.get('/prestamos-vencidos', checkPermiso('PRESTAMOS', 'leer'), reportesController.prestamosVencidos);
router.get('/pdf', checkPermiso('PRESTAMOS', 'leer'), reportesController.pdf);

module.exports = router;
