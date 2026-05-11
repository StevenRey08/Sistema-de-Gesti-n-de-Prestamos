const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('DASHBOARD', 'leer'), dashboardController.getStats);
router.get('/stats', checkPermiso('DASHBOARD', 'leer'), dashboardController.getStats);

module.exports = router;
