const { prisma } = require('../db');
const logger = require('../utils/logger');
const { generarCodigoAleatorio } = require('../utils/generadores');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const pedidoController = {
    getAll: async (req, res) => {
        const { search, estado } = req.query;
        try {
            const where = { AND: [] };
            if (estado) where.AND.push({ estado: { equals: estado, mode: 'insensitive' } });
            if (search) {
                where.AND.push({
                    OR: [
                        { numero_orden: { contains: search, mode: 'insensitive' } },
                        { proveedor: { contains: search, mode: 'insensitive' } },
                        { observaciones: { contains: search, mode: 'insensitive' } }
                    ]
                });
            }
            if (where.AND.length === 0) delete where.AND;

            const pedidos = await prisma.pedido.findMany({
                where,
                include: {
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } },
                    detalles: {
                        include: {
                            inventario: { select: { id: true, codigo: true, nombre: true } }
                        }
                    }
                },
                orderBy: { fecha_pedido: 'desc' }
            });
            res.json(pedidos);
        } catch (error) {
            logger.error("Error en pedidos.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener pedidos" });
        }
    },

    create: async (req, res) => {
        try {
            const { proveedor, observaciones, prioridad, detalles } = req.body;
            const usuario_id = req.usuario.id;

            let numero_orden;
            let existe = true;
            while (existe) {
                numero_orden = generarCodigoAleatorio("PED");
                const duplicado = await prisma.pedido.findUnique({ where: { numero_orden } });
                if (!duplicado) existe = false;
            }

            const resultado = await prisma.$transaction(async (tx) => {
                const detallesProcesados = await Promise.all((detalles || []).map(async (d) => {
                    let inventario_id = d.inventario_id;
                    // ── Modo híbrido: crear herramienta nueva si no existe ──
                    if (d.nuevo_item && d.nuevo_nombre) {
                        let codigo = d.nuevo_codigo?.trim();
                        if (!codigo) {
                            let codigoGenerado;
                            let existeCodigo = true;
                            while (existeCodigo) {
                                codigoGenerado = generarCodigoAleatorio("INV");
                                const duplicado = await tx.inventario.findUnique({ where: { codigo: codigoGenerado } });
                                if (!duplicado) existeCodigo = false;
                            }
                            codigo = codigoGenerado;
                        }
                        const nuevoItem = await tx.inventario.create({
                            data: {
                                codigo,
                                nombre: d.nuevo_nombre.trim(),
                                cantidad_total: 0,
                                cantidad_disponible: 0,
                                cantidad_danada: 0,
                                stock_minimo: 1
                            }
                        });
                        inventario_id = nuevoItem.id;
                    }
                    return {
                        inventario_id,
                        cantidad: parseInt(d.cantidad),
                        precio_unit: d.precio_unit ? parseFloat(d.precio_unit) : null
                    };
                }));

                const pedido = await tx.pedido.create({
                    data: {
                        numero_orden,
                        usuario_id,
                        proveedor,
                        prioridad,
                        observaciones,
                        estado: 'PENDIENTE',
                        detalles: {
                            create: detallesProcesados
                        }
                    },
                    include: {
                        detalles: {
                            include: {
                                inventario: { select: { id: true, codigo: true, nombre: true } }
                            }
                        },
                        usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                    }
                });
                return pedido;
            });

            res.status(201).json(resultado);
        } catch (error) {
            logger.error("Error en pedidos.create:", error);
            res.status(500).json({ status: "error", mensaje: "Error al crear el pedido" });
        }
    },

    getById: async (req, res) => {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id: req.params.id },
                include: {
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } },
                    detalles: {
                        include: {
                            inventario: { select: { id: true, codigo: true, nombre: true, cantidad_disponible: true, cantidad_danada: true, cantidad_total: true } }
                        }
                    }
                }
            });
            if (!pedido) return res.status(404).json({ status: "error", mensaje: "Pedido no encontrado" });
            res.json(pedido);
        } catch (error) {
            logger.error("Error en pedidos.getById:", error);
            res.status(500).json({ status: "error", mensaje: "Error al buscar pedido" });
        }
    },

    update: async (req, res) => {
        try {
            const { proveedor, observaciones, prioridad, estado, fecha_entrega } = req.body;
            const data = {};
            if (proveedor !== undefined) data.proveedor = proveedor;
            if (observaciones !== undefined) data.observaciones = observaciones;
            if (prioridad !== undefined) data.prioridad = prioridad;
            if (estado !== undefined) data.estado = estado;
            if (fecha_entrega !== undefined) data.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : null;

            const actualizado = await prisma.pedido.update({
                where: { id: req.params.id },
                data,
                include: {
                    detalles: {
                        include: {
                            inventario: { select: { id: true, codigo: true, nombre: true } }
                        }
                    }
                }
            });
            res.json(actualizado);
        } catch (error) {
            logger.error("Error en pedidos.update:", error);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar pedido" });
        }
    },

    recibirPedido: async (req, res) => {
        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const pedido = await tx.pedido.findUnique({
                    where: { id: req.params.id },
                    include: { detalles: true }
                });
                if (!pedido) throw new Error("Pedido no encontrado");
                if (pedido.estado === 'RECIBIDO') throw new Error("El pedido ya fue recibido");

                for (const detalle of pedido.detalles) {
                    await tx.inventario.update({
                        where: { id: detalle.inventario_id },
                        data: {
                            cantidad_total: { increment: detalle.cantidad },
                            cantidad_disponible: { increment: detalle.cantidad }
                        }
                    });

                    await tx.movimiento.create({
                        data: {
                            inventario_id: detalle.inventario_id,
                            tipo: 'ENTRADA',
                            cantidad: detalle.cantidad,
                            usuario_id: req.usuario.id,
                            observaciones: `Recepción de pedido ${pedido.numero_orden}`
                        }
                    });
                }

                const actualizado = await tx.pedido.update({
                    where: { id: req.params.id },
                    data: { estado: 'RECIBIDO', fecha_entrega: new Date() },
                    include: { detalles: true }
                });
                return actualizado;
            });
            res.json(resultado);
        } catch (error) {
            logger.error("Error en pedidos.recibir:", error);
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            await prisma.pedido.delete({ where: { id: req.params.id } });
            res.json({ message: "Pedido eliminado correctamente" });
        } catch (error) {
            logger.error("Error en pedidos.delete:", error);
            res.status(500).json({ status: "error", mensaje: "Error al eliminar pedido" });
        }
    }
};

module.exports = pedidoController;
