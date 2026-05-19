const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');
const { validarPersona } = require('../middlewares/personaValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');
const multer = require('multer');

const excelUpload = multer({ dest: 'uploads/excel/' });

router.use(verificarToken);

router.get('/', checkPermiso('PERSONAS', 'leer'), personaController.getAll);
router.post('/', checkPermiso('PERSONAS', 'ingresar'), validarPersona, logAuditoriaDetalle('PERSONAS', 'CREAR', (req, res) => `Creó persona: ${req.body.nombres} ${req.body.apellidos}`), personaController.create);
router.get('/download-template', checkPermiso('PERSONAS', 'leer'), personaController.downloadTemplate);
router.post('/import-excel', checkPermiso('PERSONAS', 'ingresar'), excelUpload.single('file'), logAuditoria('PERSONAS', 'IMPORTAR_EXCEL'), personaController.importExcel);
router.patch('/estudiantes/debaja', checkPermiso('PERSONAS', 'eliminar'), logAuditoria('PERSONAS', 'BAJA_MASIVA'), personaController.debajaEstudiantes);
router.post('/delete-bulk', checkPermiso('PERSONAS', 'eliminar'), logAuditoria('PERSONAS', 'ELIMINAR_MASIVO'), personaController.deleteBulk);
router.get('/:id', checkPermiso('PERSONAS', 'leer'), personaController.getById);
router.put('/:id', checkPermiso('PERSONAS', 'actualizar'), validarPersona, logAuditoriaDetalle('PERSONAS', 'ACTUALIZAR', (req, res) => `Actualizó persona: ${req.params.id}`), personaController.update);
router.patch('/:id/debaja', checkPermiso('PERSONAS', 'eliminar'), logAuditoriaDetalle('PERSONAS', 'BAJA', (req, res) => `Dio de baja a persona: ${req.params.id}`), personaController.debaja);
router.delete('/:id', checkPermiso('PERSONAS', 'eliminar'), logAuditoriaDetalle('PERSONAS', 'ELIMINAR', (req, res) => `Eliminó persona: ${req.params.id}`), personaController.delete);

module.exports = router;
