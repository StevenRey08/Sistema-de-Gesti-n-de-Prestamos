const { prisma } = require('../db');
const logger = require('../utils/logger');

async function marcarVencidos() {
    try {
        await prisma.prestamo.updateMany({
            where: {
                estado: 'ACTIVO',
                fecha_devolucion: { lt: new Date() },
            },
            data: { estado: 'PENDIENTE' }
        });
    } catch (error) {
        logger.error('Error al marcar préstamos vencidos:', error);
    }
}

const prestamoController = {
    // Listar y filtrar por estado o búsqueda general
    getAll: async (req, res) => {
        await marcarVencidos();
        const { search, estado } = req.query;
        try {
            const prestamos = await prisma.prestamo.findMany({
                where: {
                    AND: [
                        estado ? { estado: estado.toUpperCase() } : {},
                        search ? {
                            OR: [
                                { estado: { contains: search, mode: 'insensitive' } },
                                { observaciones: { contains: search, mode: 'insensitive' } },
                                { persona: { nombres: { contains: search, mode: 'insensitive' } } },
                                { inventario: { nombre: { contains: search, mode: 'insensitive' } } }
                            ]
                        } : {}
                    ]
                },
                include: {
                    inventario: true,
                    persona: true,
                    usuario: { select: { usuario: true } }
                },
                orderBy: { fecha_prestamo: 'desc' }
            });
            res.json(prestamos);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al obtener los préstamos" });
        }
    },

    // Obtener solo préstamos ACTIVO (Buscador rÃ¡pido para devoluciones)
    getPendientes: async (req, res) => {
        try {
            await marcarVencidos();
            const pendientes = await prisma.prestamo.findMany({
                where: { estado: 'ACTIVO' },
                include: {
                    inventario: { select: { nombre: true, codigo: true } },
                    persona: { select: { nombres: true, apellidos: true } }
                },
                orderBy: { fecha_prestamo: 'asc' }
            });
            res.json(pendientes);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al obtener préstamos pendientes" });
        }
    },

    // Crear un nuevo préstamo (Con validaciÃ³n de reserva mínima y alertas)
    create: async (req, res) => {
        const { inventario_id, persona_id, cantidad, observaciones } = req.body;
        const usuario_id = req.usuario.id; // Tomamos el ID del token por seguridad
        const cantSolicitada = parseInt(cantidad);

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                // 1. Obtener artículo y validar stock mÃ­nimo
                const articulo = await tx.inventario.findUnique({ where: { id: inventario_id } });

                if (!articulo) throw new Error("El artículo no existe.");

                const cantidadResultante = articulo.cantidad - cantSolicitada;

                // Bloqueo si no hay suficiente stock
                if (cantidadResultante < 0) {
                    throw new Error(`Stock insuficiente. Disponible: ${articulo.cantidad}, solicitado: ${cantSolicitada}.`);
                }

                // 2. Crear el préstamo
                const nuevoPrestamo = await tx.prestamo.create({
                    data: {
                        inventario_id,
                        persona_id,
                        usuario_id,
                        cantidad: cantSolicitada,
                        observaciones,
                        estado: 'ACTIVO'
                    }
                });

                // 3. Restar del inventario y marcar como Prestado (solo si no lo estaba ya)
                const prestadoData = articulo.estado === 'Prestado'
                    ? { cantidad: { decrement: cantSolicitada } }
                    : { cantidad: { decrement: cantSolicitada }, estado_anterior: articulo.estado, estado: 'Prestado' };
                const articuloActualizado = await tx.inventario.update({
                    where: { id: inventario_id },
                    data: prestadoData
                });

                // 4. Registrar movimiento de SALIDA
                await tx.movimiento.create({
                    data: {
                        inventario_id,
                        tipo: 'PRESTAMO',
                        cantidad: cantSolicitada,
                        persona_id,
                        usuario_id,
                        observaciones: `Préstamo registrado. ID: ${nuevoPrestamo.id}`
                    }
                });

                // 5. Preparar objeto de alerta si el stock llegó a 0
                const alerta = articuloActualizado.cantidad <= 2
                    ? { mensaje: `¡Alerta! ${articuloActualizado.nombre} se ha quedado sin stock.`, nivel: 'CRITICO' }
                    : null;

                return { nuevoPrestamo, alerta };
            });

            res.status(201).json({
                status: "success",
                data: resultado.nuevoPrestamo,
                alerta: resultado.alerta
            });
        } catch (error) {
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    // Registrar Devolución (Suma stock automÃ¡ticamente)
    registrarDevolucion: async (req, res) => {
        const { id } = req.params;
        const { observaciones_dev, estado_fisico } = req.body;
        const usuario_id = req.usuario.id; // Tomamos el ID del token por seguridad

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const prestamo = await tx.prestamo.findUnique({ where: { id } });

                if (!prestamo) throw new Error("Préstamo no encontrado.");
                if (prestamo.estado === 'DEVUELTO') throw new Error("Ya fue devuelto.");

                // 1. Marcar préstamo como devuelto
                const actualizado = await tx.prestamo.update({
                    where: { id },
                    data: {
                        estado: 'DEVUELTO',
                        fecha_devolucion: new Date(),
                        observaciones: observaciones_dev
                            ? `${prestamo.observaciones || ''} | DEV: ${observaciones_dev}`
                            : prestamo.observaciones
                    }
                });

                // 2. Devolver stock al inventario y restaurar estado anterior si no hay más préstamos activos
                const articuloDev = await tx.inventario.findUnique({ where: { id: prestamo.inventario_id } });
                const activosRestantes = await tx.prestamo.count({
                    where: { inventario_id: prestamo.inventario_id, estado: { in: ['ACTIVO', 'PENDIENTE'] }, id: { not: prestamo.id } }
                });
                const estadoRestaurado = activosRestantes === 0
                    ? (estado_fisico || articuloDev?.estado_anterior || 'Nuevo')
                    : undefined;
                await tx.inventario.update({
                    where: { id: prestamo.inventario_id },
                    data: {
                        cantidad: { increment: prestamo.cantidad },
                        estado: estadoRestaurado,
                        ...(activosRestantes === 0 ? { estado_anterior: null } : {}),
                    }
                });

                // 3. Registrar movimiento de ENTRADA
                await tx.movimiento.create({
                    data: {
                        inventario_id: prestamo.inventario_id,
                        tipo: 'DEVUELTO',
                        cantidad: prestamo.cantidad,
                        persona_id: prestamo.persona_id,
                        usuario_id,
                        observaciones: `Devolución de préstamo ID: ${id}`
                    }
                });

                return actualizado;
            });

            res.json(resultado);
        } catch (error) {
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    // Actualizar préstamo (solo campos no críticos para stock)
    update: async (req, res) => {
        try {
            const { observaciones, fecha_devolucion, estado, persona_id, usuario_id } = req.body;
            const payload = {};
            
            if (observaciones !== undefined) payload.observaciones = observaciones;
            if (estado !== undefined) payload.estado = estado;
            if (persona_id !== undefined) payload.persona_id = persona_id;
            if (usuario_id !== undefined) payload.usuario_id = usuario_id;
            
            if (fecha_devolucion !== undefined) {
                payload.fecha_devolucion = fecha_devolucion ? new Date(fecha_devolucion) : null;
            }

            if (Object.keys(payload).length === 0) {
                return res.status(400).json({ status: "error", mensaje: "No hay campos para actualizar" });
            }

            const actualizado = await prisma.prestamo.update({
                where: { id: req.params.id },
                data: payload
            });
            res.json(actualizado);
        } catch (error) {
            logger.error("Error al actualizar préstamo:", { 
                error: error.message, 
                stack: error.stack,
                id: req.params.id, 
                body: req.body 
            });
            res.status(500).json({ 
                status: "error", 
                mensaje: "Error al actualizar el préstamo",
                detalles: [error.message] 
            });
        }
    },

    getById: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: { inventario: true, persona: true, usuario: true }
            });
            if (!prestamo) return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });
            res.json(prestamo);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar el préstamo" });
        }
    },

    delete: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: { movimientos: true }
            });

            if (!prestamo) {
                return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });
            }

            await prisma.$transaction(async (tx) => {
                // Si estÃ¡ ACTIVO, restaurar el stock y el estado anterior antes de eliminar
                if (prestamo.estado === 'ACTIVO') {
                    const articulo = await tx.inventario.findUnique({ where: { id: prestamo.inventario_id } });
                    const activosRestantes = await tx.prestamo.count({
                        where: { inventario_id: prestamo.inventario_id, estado: { in: ['ACTIVO', 'PENDIENTE'] }, id: { not: prestamo.id } }
                    });
                    const estadoRestaurado = activosRestantes === 0
                        ? (articulo?.estado_anterior || 'Nuevo')
                        : undefined;
                    await tx.inventario.update({
                        where: { id: prestamo.inventario_id },
                        data: {
                            cantidad: { increment: prestamo.cantidad },
                            estado: estadoRestaurado,
                            ...(activosRestantes === 0 ? { estado_anterior: null } : {}),
                        }
                    });
                }

                // Eliminar movimientos asociados
                if (prestamo.movimientos?.length > 0) {
                    await tx.movimiento.deleteMany({
                        where: { prestamo_id: prestamo.id }
                    });
                }

                await tx.prestamo.delete({ where: { id: prestamo.id } });
            });

            res.json({ message: "Préstamo eliminado correctamente. Stock restaurado." });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar el préstamo" });
        }
    }
};

module.exports = prestamoController;