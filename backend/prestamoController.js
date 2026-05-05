const { prisma } = require('../db');

const prestamoController = {
    // Listar y filtrar por estado o búsqueda general
    getAll: async (req, res) => {
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
            res.status(500).json({ error: "Error al obtener los préstamos" });
        }
    },

    // Obtener solo préstamos ACTIVO (Buscador rápido para devoluciones)
    getPendientes: async (req, res) => {
        try {
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
            res.status(500).json({ error: "Error al obtener préstamos pendientes" });
        }
    },

    // Crear un nuevo préstamo (Con validación de reserva mínima y alertas)
    create: async (req, res) => {
        const { inventario_id, persona_id, cantidad, observaciones } = req.body;
        const usuario_id = req.usuario.id; // Tomamos el ID del token por seguridad
        const cantSolicitada = parseInt(cantidad);

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                // 1. Obtener artículo y validar stock mínimo
                const articulo = await tx.inventario.findUnique({ where: { id: inventario_id } });

                if (!articulo) throw new Error("El artículo no existe.");

                const cantidadResultante = articulo.cantidad - cantSolicitada;

                // Bloqueo si baja del stock_minimo
                if (cantidadResultante < articulo.cantidad_minima) {
                    throw new Error(`Operación denegada: El stock no puede bajar de la reserva mínima (${articulo.cantidad_minima}). Disponible: ${articulo.cantidad}.`);
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

                // 3. Restar del inventario
                const articuloActualizado = await tx.inventario.update({
                    where: { id: inventario_id },
                    data: { cantidad: { decrement: cantSolicitada } }
                });

                // 4. Registrar movimiento de SALIDA
                await tx.movimiento.create({
                    data: {
                        inventario_id,
                        tipo: 'SALIDA',
                        cantidad: cantSolicitada,
                        persona_id,
                        usuario_id,
                        observaciones: `Préstamo registrado. ID: ${nuevoPrestamo.id}`
                    }
                });

                // 5. Preparar objeto de alerta si el stock quedó exactamente en el mínimo
                const alerta = articuloActualizado.cantidad === articuloActualizado.cantidad_minima
                    ? { mensaje: `¡Alerta! ${articuloActualizado.nombre} ha alcanzado su stock mínimo.`, nivel: 'CRITICO' }
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

    // Registrar Devolución (Suma stock automáticamente)
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

                // 2. Devolver stock al inventario
                await tx.inventario.update({
                    where: { id: prestamo.inventario_id },
                    data: {
                        cantidad: { increment: prestamo.cantidad },
                        estado: estado_fisico || undefined
                    }
                });

                // 3. Registrar movimiento de ENTRADA
                await tx.movimiento.create({
                    data: {
                        inventario_id: prestamo.inventario_id,
                        tipo: 'ENTRADA',
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
            res.status(400).json({ error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: { inventario: true, persona: true, usuario: true }
            });
            if (!prestamo) return res.status(404).json({ error: "Préstamo no encontrado" });
            res.json(prestamo);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el préstamo" });
        }
    },

    delete: async (req, res) => {
        try {
            await prisma.prestamo.delete({ where: { id: req.params.id } });
            res.json({ message: "Registro eliminado" });
        } catch (error) {
            res.status(500).json({ error: "No se puede eliminar un préstamo con historial activo" });
        }
    }
};

module.exports = prestamoController;