const { prisma } = require('../db');
const logger = require('../utils/logger');
const { generarCodigoAleatorio } = require('../utils/generadores');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const inventarioController = {
    getAll: async (req, res) => {
        const { search, categoria, estado } = req.query;
        try {
            const where = { AND: [] };
            if (categoria) where.AND.push({ categoria_id: categoria });
            if (estado) {
                if (estado === 'DISPONIBLE') {
                    where.AND.push({ cantidad_disponible: { gt: 0 } });
                } else if (estado === 'DANADO') {
                    where.AND.push({ cantidad_danada: { gt: 0 } });
                } else if (estado === 'SIN_STOCK') {
                    where.AND.push({ cantidad_disponible: { equals: 0 } });
                }
            }
            if (search) {
                where.AND.push({
                    OR: [
                        { nombre: { contains: search, mode: 'insensitive' } },
                        { codigo: { contains: search, mode: 'insensitive' } }
                    ]
                });
            }
            if (where.AND.length === 0) delete where.AND;

            const items = await prisma.inventario.findMany({
                where,
                include: {
                    categoria: true,
                    detalles_pedidos: {
                        include: {
                            pedido: { select: { id: true, numero_orden: true, fecha_pedido: true, proveedor: true } }
                        }
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
                include: { categoria: true }
            });
            const alertas = inventarioCompleto.filter(item =>
                item.cantidad_disponible <= item.stock_minimo
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
            const cantTotal = data.cantidad_total !== undefined && data.cantidad_total !== null && data.cantidad_total !== ''
                ? parseInt(data.cantidad_total) : 0;
            const cantDisponible = data.cantidad_disponible !== undefined && data.cantidad_disponible !== null && data.cantidad_disponible !== ''
                ? parseInt(data.cantidad_disponible) : cantTotal;
            data.cantidad_total = cantTotal;
            data.cantidad_disponible = cantDisponible;
            data.cantidad_danada = data.cantidad_danada ? parseInt(data.cantidad_danada) : 0;
            data.stock_minimo = data.stock_minimo ? parseInt(data.stock_minimo) : 1;

            const nuevo = await prisma.inventario.create({
                data,
                include: { categoria: true }
            });

            await prisma.movimiento.create({
                data: {
                    inventario_id: nuevo.id,
                    tipo: 'ENTRADA',
                    cantidad: cantDisponible,
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
                    movimientos: {
                        take: 10,
                        orderBy: { fecha: 'desc' }
                    },
                    detalles_pedidos: {
                        include: {
                            pedido: { select: { id: true, numero_orden: true, fecha_pedido: true, proveedor: true, estado: true } }
                        }
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
            if (data.cantidad_total !== undefined) data.cantidad_total = parseInt(data.cantidad_total);
            if (data.cantidad_disponible !== undefined) data.cantidad_disponible = parseInt(data.cantidad_disponible);
            if (data.cantidad_danada !== undefined) data.cantidad_danada = parseInt(data.cantidad_danada);
            if (data.stock_minimo !== undefined) data.stock_minimo = parseInt(data.stock_minimo);

            const actualizado = await prisma.inventario.update({
                where: { id: req.params.id },
                data: data
            });

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
