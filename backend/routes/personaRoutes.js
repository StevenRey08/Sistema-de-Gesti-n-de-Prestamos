const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { validarPersona } = require('../middlewares/personaValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const multer = require('multer');

const excelUpload = multer({ dest: 'uploads/excel/' });

router.use(verificarToken);

// Rutas estáticas primero (antes de /:id)
router.get('/', checkPermiso('PERSONAS', 'leer'), personaController.getAll);
router.post('/', checkPermiso('PERSONAS', 'ingresar'), validarPersona, personaController.create);
router.get('/download-template', checkPermiso('PERSONAS', 'leer'), personaController.downloadTemplate);
router.post('/import-excel', checkPermiso('PERSONAS', 'ingresar'), excelUpload.single('file'), personaController.importExcel);
router.delete('/estudiantes', checkPermiso('PERSONAS', 'eliminar'), personaController.deleteEstudiantes);
router.post('/delete-bulk', checkPermiso('PERSONAS', 'eliminar'), personaController.deleteBulk);
// Rutas paramétricas después
router.get('/:id', checkPermiso('PERSONAS', 'leer'), personaController.getById);
router.put('/:id', checkPermiso('PERSONAS', 'actualizar'), validarPersona, personaController.update);
router.delete('/:id', checkPermiso('PERSONAS', 'eliminar'), personaController.delete);

module.exports = router;
