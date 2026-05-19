const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const { validarPrestamo, validarDevolucion } = require('../middlewares/prestamoValidar');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getAll);
router.get('/vencidos', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getVencidos);
router.get('/:id', checkPermiso('PRESTAMOS', 'leer'), prestamoController.getById);
router.get('/:id/pdf', checkPermiso('PRESTAMOS', 'leer'), prestamoController.generarPDF);

router.post('/lote', checkPermiso('PRESTAMOS', 'ingresar'), logAuditoria('PRESTAMOS', 'CREAR_LOTE'), prestamoController.createLote);
router.post('/', checkPermiso('PRESTAMOS', 'ingresar'), validarPrestamo, logAuditoria('PRESTAMOS', 'CREAR'), prestamoController.create);
router.put('/:id', checkPermiso('PRESTAMOS', 'actualizar'), logAuditoriaDetalle('PRESTAMOS', 'ACTUALIZAR', (req, res) => `Actualizó préstamo: ${req.params.id}`), prestamoController.update);
router.patch('/:id/devolucion', checkPermiso('PRESTAMOS', 'actualizar'), validarDevolucion, logAuditoriaDetalle('PRESTAMOS', 'DEVOLUCION', (req, res) => `Registró devolución préstamo: ${req.params.id}`), prestamoController.registrarDevolucion);

router.delete('/:id', checkPermiso('PRESTAMOS', 'eliminar'), logAuditoriaDetalle('PRESTAMOS', 'ELIMINAR', (req, res) => `Eliminó préstamo: ${req.params.id}`), prestamoController.delete);

module.exports = router;
