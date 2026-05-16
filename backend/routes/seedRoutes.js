const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seedController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.post('/reset', seedController.reset);
router.post('/seed', seedController.seed);

module.exports = router;
