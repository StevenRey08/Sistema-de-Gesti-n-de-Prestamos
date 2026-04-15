const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cajaController');

router.get('/',     ctrl.getAll);
router.post('/',    ctrl.create);
router.get('/:id',  ctrl.getById);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;
