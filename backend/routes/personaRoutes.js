const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { validarPersona } = require('../middlewares/personaValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const multer = require('multer');

const excelUpload = multer({ dest: 'uploads/excel/' });

router.use(verificarToken);

router.post('/', checkPermiso('PERSONAS', 'ingresar'), validarPersona, personaController.create);
router.put('/:id', checkPermiso('PERSONAS', 'actualizar'), validarPersona, personaController.update);
router.get('/', checkPermiso('PERSONAS', 'leer'), personaController.getAll);
router.get('/:id', checkPermiso('PERSONAS', 'leer'), personaController.getById);
router.delete('/estudiantes', checkPermiso('PERSONAS', 'eliminar'), personaController.deleteEstudiantes);
router.post('/delete-bulk', checkPermiso('PERSONAS', 'eliminar'), personaController.deleteBulk);
router.post('/import-excel', checkPermiso('PERSONAS', 'ingresar'), excelUpload.single('file'), personaController.importExcel);
router.delete('/:id', checkPermiso('PERSONAS', 'eliminar'), personaController.delete);

module.exports = router;
