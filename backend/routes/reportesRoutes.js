const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/bajo-stock', reportesController.bajoStock);
router.get('/mas-prestados', reportesController.masPrestados);
router.get('/menos-prestados', reportesController.menosPrestados);
router.get('/pdf', reportesController.pdf);

module.exports = router;
