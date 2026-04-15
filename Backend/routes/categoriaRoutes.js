const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.getAll);
router.get('/:id', categoriaController.getById);
router.post('/', categoriaController.create);
router.put('/:id', categoriaController.update);
router.delete('/:id', categoriaController.delete);

module.exports = router;
=======
const ctrl = require('../controllers/categoriaController');

router.get('/',     ctrl.getAll);
router.post('/',    ctrl.create);
router.get('/:id',  ctrl.getById);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
>>>>>>> 1eb0b922b86b9b1b15126cd91379872e78ca0f05
