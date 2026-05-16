const { prisma } = require('../db');
const logger = require('../utils/logger');

const movimientoController = {
    getAll: async (req, res) => {
        const { tipo, inventario_id, persona_id } = req.query;
        try {
            const movimientos = await prisma.movimiento.findMany({
                where: {
                    AND: [
                        tipo ? { tipo: tipo.toUpperCase() } : {},
                        inventario_id ? { inventario_id } : {},
                        persona_id ? { persona_id } : {}
                    ]
                },
                include: {
                    inventario: true,
                    ubicacion_origen: true,
                    ubicacion_destino: true,
                    persona: true,
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                },
                orderBy: { fecha: 'desc' }
            });
            res.json(movimientos);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al obtener historial" });
        }
    },

    create: async (req, res) => {
        const {
            inventario_id, tipo, cantidad,
            ubicacion_destino_id, ubicacion_origen_id,
            persona_id, observaciones
        } = req.body;

        const usuario_id = req.usuario?.id || req.body.usuario_id;
        const cantMovimiento = parseInt(cantidad);
        const tipoUpper = tipo.toUpperCase();

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const articulo = await tx.inventario.findUnique({ where: { id: inventario_id } });
                if (!articulo) throw new Error("El producto no existe en el inventario.");

                let nuevaDisponible = articulo.cantidad_disponible;
                let nuevaDanada = articulo.cantidad_danada;

                if (tipoUpper === 'ENTRADA') {
                    nuevaDisponible += cantMovimiento;
                } else if (tipoUpper === 'SALIDA') {
                    if (articulo.cantidad_disponible < cantMovimiento) {
                        throw new Error(`Stock insuficiente. Disponible: ${articulo.cantidad_disponible}`);
                    }
                    nuevaDisponible -= cantMovimiento;
                } else if (tipoUpper === 'DAÑADO') {
                    if (articulo.cantidad_disponible < cantMovimiento) {
                        throw new Error(`Stock insuficiente para marcar como dañado. Disponible: ${articulo.cantidad_disponible}`);
                    }
                    nuevaDisponible -= cantMovimiento;
                    nuevaDanada += cantMovimiento;
                }

                const nuevoMovimiento = await tx.movimiento.create({
                    data: {
                        inventario_id,
                        tipo: tipoUpper,
                        cantidad: cantMovimiento,
                        ubicacion_origen_id,
                        ubicacion_destino_id,
                        persona_id,
                        usuario_id,
                        observaciones
                    }
                });

                const updateData = { cantidad_disponible: nuevaDisponible, cantidad_danada: nuevaDanada };
                if ((tipoUpper === 'TRASLADO' || tipoUpper === 'ENTRADA') && ubicacion_destino_id) {
                }

                await tx.inventario.update({
                    where: { id: inventario_id },
                    data: updateData
                });

                return nuevoMovimiento;
            });

            res.status(201).json(resultado);
        } catch (error) {
            logger.error("Error en movimientos.create:", error);
            res.status(400).json({ status: "error", mensaje: error.message || "Error al procesar el movimiento" });
        }
    },

    getById: async (req, res) => {
        try {
            const movimiento = await prisma.movimiento.findUnique({
                where: { id: req.params.id },
                include: {
                    inventario: true,
                    ubicacion_origen: true,
                    ubicacion_destino: true,
                    persona: true,
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                }
            });
            if (!movimiento) return res.status(404).json({ status: "error", mensaje: "No encontrado" });
            res.json(movimiento);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar" });
        }
    },

    delete: async (req, res) => {
        try {
            await prisma.movimiento.delete({ where: { id: req.params.id } });
            res.json({ message: "Eliminado" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar" });
        }
    }
};

module.exports = movimientoController;
