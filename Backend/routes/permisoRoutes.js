const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');

router.get('/', permisoController.getAll);
router.get('/:id', permisoController.getById);
router.post('/', permisoController.create);
router.put('/:id', permisoController.update);
router.delete('/:id', permisoController.delete);

module.exports = router;