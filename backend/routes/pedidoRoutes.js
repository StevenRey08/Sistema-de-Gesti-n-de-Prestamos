const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkPermiso } = require('../middlewares/permisoMiddleware');
const { logAuditoria, logAuditoriaDetalle } = require('../middlewares/auditoriaMiddleware');

router.use(verificarToken);

router.get('/', checkPermiso('PEDIDOS', 'leer'), pedidoController.getAll);
router.get('/:id', checkPermiso('PEDIDOS', 'leer'), pedidoController.getById);
router.get('/:id/pdf', checkPermiso('PEDIDOS', 'leer'), pedidoController.generarPdf);
router.post('/', checkPermiso('PEDIDOS', 'ingresar'), logAuditoria('PEDIDOS', 'CREAR'), pedidoController.create);
router.put('/:id', checkPermiso('PEDIDOS', 'actualizar'), logAuditoriaDetalle('PEDIDOS', 'ACTUALIZAR', (req, res) => `Actualizó pedido: ${req.params.id}`), pedidoController.update);
router.patch('/:id/recibir', checkPermiso('PEDIDOS', 'actualizar'), logAuditoriaDetalle('PEDIDOS', 'RECIBIR', (req, res) => `Recibió pedido: ${req.params.id}`), pedidoController.recibirPedido);
router.delete('/:id', checkPermiso('PEDIDOS', 'eliminar'), logAuditoriaDetalle('PEDIDOS', 'ELIMINAR', (req, res) => `Eliminó pedido: ${req.params.id}`), pedidoController.delete);

module.exports = router;
