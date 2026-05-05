const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');

router.use(verificarToken);

router.get('/stats', checkPermiso('Dashboard', 'leer'), dashboardController.getStats);

module.exports = router;
