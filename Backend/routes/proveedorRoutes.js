const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

// Definir los puntos de entrada (Endpoints)
router.get('/', proveedorController.getAll);        // Listar y buscar
router.get('/:id', proveedorController.getById);    // Ver uno solo
router.post('/', proveedorController.create);       // Crear
router.put('/:id', proveedorController.update);     // Editar
router.delete('/:id', proveedorController.delete);  // Eliminar

module.exports = router;
