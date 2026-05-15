const { prisma } = require('../db');
const logger = require('../utils/logger');
const { generarCodigoAleatorio } = require('../utils/generadores');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const inventarioController = {
    getAll: async (req, res) => {
        const { search, categoria, ubicacion, estado } = req.query;
        try {
            const items = await prisma.inventario.findMany({
                where: {
                    AND: [
                        categoria ? { categoria_id: categoria } : {},
                        ubicacion ? { ubicacion_id: ubicacion } : {},
                        estado ? { estado: { equals: estado, mode: 'insensitive' } } : {},
                        search ? {
                            OR: [
                                { nombre: { contains: search, mode: 'insensitive' } },
                                { codigo: { contains: search, mode: 'insensitive' } }
                            ]
                        } : {}
                    ]
                },
                include: {
                    categoria: true,
                    ubicaciones: {
                        include: { padre: true }
                    }
                },
                orderBy: { nombre: 'asc' }
            });
            res.json(items);
        } catch (error) {
            logger.error("Error en inventario.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener el inventario" });
        }
    },

    getAlertasStock: async (req, res) => {
        try {
            const inventarioCompleto = await prisma.inventario.findMany({
                include: { categoria: true, ubicaciones: true }
            });

            const alertas = inventarioCompleto.filter(item =>
                item.cantidad <= 2
            );

            res.json({
                total_alertas: alertas.length,
                articulos: alertas
            });
        } catch (error) {
            console.error("Error al obtener alertas:", error);
            res.status(500).json({ status: "error", mensaje: "Error al generar reporte de alertas" });
        }
    },

    create: async (req, res) => {
        try {
            let data = req.body;
            if (req.file) {
                data.imagen_ruta = `/uploads/inventario/${req.file.filename}`;
            }

            if (!data.codigo || data.codigo.trim() === "") {
                let codigoGenerado;
                let existe = true;

                while (existe) {
                    codigoGenerado = generarCodigoAleatorio("INV");
                    const duplicado = await prisma.inventario.findUnique({
                        where: { codigo: codigoGenerado }
                    });
                    if (!duplicado) existe = false;
                }
                data.codigo = codigoGenerado;
            }

            data.cantidad = data.cantidad !== undefined && data.cantidad !== null && data.cantidad !== '' ? parseInt(data.cantidad) : 1;
            const nuevo = await prisma.inventario.create({
                data,
                include: { ubicaciones: true, categoria: true }
            });

            await prisma.movimiento.create({
                data: {
                    inventario_id: nuevo.id,
                    tipo: 'ENTRADA',
                    cantidad: data.cantidad,
                    usuario_id: req.usuario?.id,
                    observaciones: `Artículo creado con código ${nuevo.codigo}`
                }
            });

            res.status(201).json(nuevo);
        } catch (error) {
            logger.error("Error en inventario.create:", error);
            const duplicateError = buildUniqueConstraintError(error, {
                codigo: "Ya existe un artículo de inventario registrado con ese código.",
            }, "Ya existe un artículo de inventario con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear el artículo" });
        }
    },

    getById: async (req, res) => {
        try {
            const item = await prisma.inventario.findUnique({
                where: { id: req.params.id },
                include: {
                    categoria: true,
                    ubicaciones: {
                        include: { padre: true }
                    },
                    movimientos: {
                        take: 10,
                        orderBy: { fecha: 'desc' }
                    }
                }
            });
            if (!item) return res.status(404).json({ status: "error", mensaje: "Artículo no encontrado" });
            res.json(item);
        } catch (error) {
            logger.error("Error en inventario.getById:", error);
            res.status(500).json({ status: "error", mensaje: "Error al buscar el artículo" });
        }
    },

    update: async (req, res) => {
        try {
            const existente = await prisma.inventario.findUnique({ where: { id: req.params.id } });
            if (!existente) return res.status(404).json({ status: "error", mensaje: "Artículo no encontrado" });

            const data = req.body;
            if (req.file) {
                data.imagen_ruta = `/uploads/inventario/${req.file.filename}`;
            }

            if (data.cantidad !== undefined && data.cantidad !== null && data.cantidad !== '') data.cantidad = parseInt(data.cantidad);
            const actualizado = await prisma.inventario.update({
                where: { id: req.params.id },
                data: data
            });

            if (data.cantidad !== undefined && data.cantidad !== existente.cantidad) {
                const diferencia = data.cantidad - existente.cantidad;
                await prisma.movimiento.create({
                    data: {
                        inventario_id: actualizado.id,
                        tipo: 'AJUSTE',
                        cantidad: Math.abs(diferencia),
                        usuario_id: req.usuario?.id,
                        observaciones: `Stock ajustado de ${existente.cantidad} a ${data.cantidad} (${diferencia > 0 ? '+' : ''}${diferencia})`
                    }
                });
            }

            res.json(actualizado);
        } catch (error) {
            logger.error("Error en inventario.update:", error);
            const duplicateError = buildUniqueConstraintError(error, {
                codigo: "Ya existe un artículo de inventario registrado con ese código.",
            }, "Ya existe un artículo de inventario con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar el artículo" });
        }
    },

    delete: async (req, res) => {
        try {
            const existente = await prisma.inventario.findUnique({ where: { id: req.params.id } });
            if (!existente) return res.status(404).json({ status: "error", mensaje: "Artículo no encontrado" });

            const prestamosActivos = await prisma.prestamo.count({
                where: { inventario_id: req.params.id, estado: 'ACTIVO' }
            });
            if (prestamosActivos > 0) {
                return res.status(400).json({
                    error: "No se puede eliminar: el artículo tiene préstamos activos."
                });
            }

            await prisma.inventario.delete({ where: { id: req.params.id } });
            res.json({ message: "Artículo eliminado correctamente" });
        } catch (error) {
            logger.error("Error en inventario.delete:", error);
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: "No se puede eliminar: el artículo tiene historial de movimientos o préstamos asociados."
                });
            }
            res.status(500).json({ status: "error", mensaje: "Error al eliminar el artículo" });
        }
    }
};

module.exports = inventarioController;
