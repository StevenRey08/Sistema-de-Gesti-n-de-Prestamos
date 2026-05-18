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

            const itemsIds = items.map(i => i.id);
            const detallesActivos = await prisma.prestamoDetalle.groupBy({
                by: ['inventario_id'],
                where: {
                    inventario_id: { in: itemsIds },
                    prestamo: { estado: { in: ['ACTIVO', 'VENCIDO'] } }
                },
                _sum: { cantidad: true }
            });

            const prestamosDirectos = await prisma.prestamo.groupBy({
                by: ['inventario_id'],
                where: {
                    inventario_id: { in: itemsIds },
                    estado: { in: ['ACTIVO', 'VENCIDO'] }
                },
                _sum: { cantidad: true }
            });

            const cantidadPrestadaMap = {};
            detallesActivos.forEach(d => {
                cantidadPrestadaMap[d.inventario_id] = (cantidadPrestadaMap[d.inventario_id] || 0) + (d._sum.cantidad || 0);
            });
            prestamosDirectos.forEach(p => {
                if (p.inventario_id) {
                    cantidadPrestadaMap[p.inventario_id] = (cantidadPrestadaMap[p.inventario_id] || 0) + (p._sum.cantidad || 0);
                }
            });

            const itemsConPrestada = items.map(item => ({
                ...item,
                cantidad_prestada: cantidadPrestadaMap[item.id] || 0
            }));

            res.json(itemsConPrestada);
        } catch (error) {
            logger.error("Error en inventario.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener el inventario" });
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
            const cantDanada = data.cantidad_danada ? parseInt(data.cantidad_danada) : 0;
            const cantDisponible = data.cantidad_disponible !== undefined && data.cantidad_disponible !== null && data.cantidad_disponible !== ''
                ? parseInt(data.cantidad_disponible) : (cantTotal - cantDanada);
            data.cantidad_total = cantTotal;
            data.cantidad_disponible = cantDisponible;
            data.cantidad_danada = cantDanada;

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

            const prestamosDirectos = await prisma.prestamo.aggregate({
                where: { inventario_id: req.params.id, estado: { in: ['ACTIVO', 'VENCIDO'] } },
                _sum: { cantidad: true }
            });
            const detallesActivos = await prisma.prestamoDetalle.aggregate({
                where: { inventario_id: req.params.id, prestamo: { estado: { in: ['ACTIVO', 'VENCIDO'] } } },
                _sum: { cantidad: true }
            });
            const cantidadPrestada = (prestamosDirectos._sum.cantidad || 0) + (detallesActivos._sum.cantidad || 0);

            const danadaAnterior = existente.cantidad_danada;
            const disponibleAnterior = existente.cantidad_disponible;
            const totalAnterior = existente.cantidad_total;

            const nuevoDanada = data.cantidad_danada !== undefined ? parseInt(data.cantidad_danada) : danadaAnterior;
            const nuevoDisponible = data.cantidad_disponible !== undefined ? parseInt(data.cantidad_disponible) : disponibleAnterior;
            const nuevoTotal = nuevoDisponible + nuevoDanada + cantidadPrestada;

            if (nuevoDanada < 0) {
                return res.status(400).json({ status: "error", mensaje: "La cantidad dañada no puede ser negativa." });
            }
            if (nuevoDisponible < 0) {
                return res.status(400).json({ status: "error", mensaje: "La cantidad disponible no puede ser negativa." });
            }

            data.cantidad_danada = nuevoDanada;
            data.cantidad_disponible = nuevoDisponible;
            data.cantidad_total = nuevoTotal;

            const cambioTotal = nuevoTotal - totalAnterior;
            const cambioDanada = nuevoDanada - danadaAnterior;
            const cambioDisponible = nuevoDisponible - disponibleAnterior;

            const actualizado = await prisma.inventario.update({
                where: { id: req.params.id },
                data: data
            });

            const partes = [];
            if (cambioDisponible !== 0) partes.push(`Disponible: ${disponibleAnterior} → ${nuevoDisponible}`);
            if (cambioDanada !== 0) partes.push(`Dañada: ${danadaAnterior} → ${nuevoDanada}`);
            if (cambioTotal !== 0) partes.push(`Total: ${totalAnterior} → ${nuevoTotal}`);

            if (partes.length > 0) {
                await prisma.movimiento.create({
                    data: {
                        inventario_id: req.params.id,
                        tipo: 'ACTUALIZACION_STOCK',
                        cantidad: Math.abs(cambioTotal),
                        usuario_id: req.usuario?.id,
                        observaciones: `Actualización de stock. ${partes.join(', ')}`
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

            const prestamosDirectos = await prisma.prestamo.count({
                where: { inventario_id: req.params.id, estado: 'ACTIVO' }
            });
            const prestamosDetalles = await prisma.prestamoDetalle.count({
                where: { inventario_id: req.params.id, prestamo: { estado: 'ACTIVO' } }
            });
            if (prestamosDirectos > 0 || prestamosDetalles > 0) {
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
