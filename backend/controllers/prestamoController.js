const { prisma } = require('../db');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

async function marcarVencidos() {
    try {
        await prisma.prestamo.updateMany({
            where: {
                estado: 'ACTIVO',
                fecha_devolucion: { lt: new Date() },
            },
            data: { estado: 'VENCIDO' }
        });
    } catch (error) {
        logger.error('Error al marcar préstamos vencidos:', error);
    }
}

function includeDetalles() {
    return {
        inventario: true,
        detalles: {
            include: {
                inventario: { select: { id: true, nombre: true, codigo: true } }
            }
        },
        persona: true,
        instructor: { select: { id: true, nombres: true, apellidos: true, matricula: true } },
        usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
    };
}

const prestamoController = {
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
                                { inventario: { nombre: { contains: search, mode: 'insensitive' } } },
                                { detalles: { some: { inventario: { nombre: { contains: search, mode: 'insensitive' } } } } }
                            ]
                        } : {}
                    ]
                },
                include: includeDetalles(),
                orderBy: { fecha_prestamo: 'desc' }
            });
            res.json(prestamos);
        } catch (error) {
            logger.error("Error en prestamos.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener los préstamos", detalle: error.message });
        }
    },

    getVencidos: async (req, res) => {
        try {
            await marcarVencidos();
            const vencidos = await prisma.prestamo.findMany({
                where: { estado: 'VENCIDO' },
                include: {
                    inventario: { select: { nombre: true, codigo: true } },
                    persona: { select: { nombres: true, apellidos: true, matricula: true } },
                    instructor: { select: { id: true, nombres: true, apellidos: true } },
                    detalles: {
                        include: {
                            inventario: { select: { nombre: true, codigo: true } }
                        }
                    }
                },
                orderBy: { fecha_prestamo: 'asc' }
            });
            res.json(vencidos);
        } catch (error) {
            logger.error("Error en prestamos.getVencidos:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener préstamos pendientes", detalle: error.message });
        }
    },

    create: async (req, res) => {
        const { inventario_id, persona_id, instructor_id, cantidad, fecha_devolucion, observaciones } = req.body;
        const usuario_id = req.usuario.id;
        const cantSolicitada = parseInt(cantidad);

        if (!inventario_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un artículo." });
        if (!persona_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un estudiante." });
        if (!instructor_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un instructor." });
        if (!fecha_devolucion) return res.status(400).json({ status: "error", mensaje: "Debes ingresar una fecha de devolución." });

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const articulo = await tx.inventario.findUnique({ where: { id: inventario_id } });
                if (!articulo) throw new Error("El artículo no existe.");

                const cantidadResultante = articulo.cantidad_disponible - cantSolicitada;
                if (cantidadResultante < 0) {
                    throw new Error(`Stock insuficiente. Disponible: ${articulo.cantidad_disponible}, solicitado: ${cantSolicitada}.`);
                }

                const nuevoPrestamo = await tx.prestamo.create({
                    data: {
                        inventario_id,
                        persona_id,
                        instructor_id,
                        usuario_id,
                        cantidad: cantSolicitada,
                        fecha_devolucion: new Date(fecha_devolucion),
                        observaciones,
                        estado: 'ACTIVO'
                    }
                });

                await tx.inventario.update({
                    where: { id: inventario_id },
                    data: {
                        cantidad_disponible: { decrement: cantSolicitada },
                    }
                });

                await tx.movimiento.create({
                    data: {
                        inventario_id,
                        tipo: 'PRESTAMO',
                        cantidad: cantSolicitada,
                        persona_id,
                        usuario_id,
                        prestamo_id: nuevoPrestamo.id,
                        observaciones: `Préstamo registrado. ID: ${nuevoPrestamo.id}`
                    }
                });

                return { nuevoPrestamo };
            });

            res.status(201).json({
                status: "success",
                data: resultado.nuevoPrestamo
            });
        } catch (error) {
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    createLote: async (req, res) => {
        const { items, persona_id, instructor_id, fecha_devolucion, observaciones } = req.body;
        const usuario_id = req.usuario?.id || req.body.usuario_id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ status: "error", mensaje: "Debes incluir al menos un artículo." });
        }
        if (!persona_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un estudiante." });
        if (!instructor_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un instructor." });
        if (!fecha_devolucion) return res.status(400).json({ status: "error", mensaje: "Debes ingresar una fecha de devolución." });

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                for (const item of items) {
                    const { inventario_id, cantidad } = item;
                    const cantSolicitada = parseInt(cantidad);
                    if (!inventario_id || !cantSolicitada || cantSolicitada < 1) {
                        throw new Error(`Cantidad inválida para un artículo.`);
                    }
                    const articulo = await tx.inventario.findUnique({ where: { id: inventario_id } });
                    if (!articulo) throw new Error(`Artículo no encontrado.`);
                    if (articulo.cantidad_disponible < cantSolicitada) {
                        throw new Error(`Stock insuficiente para ${articulo.nombre}. Disponible: ${articulo.cantidad_disponible}, solicitado: ${cantSolicitada}.`);
                    }
                }

                const prestamo = await tx.prestamo.create({
                    data: {
                        persona_id,
                        instructor_id,
                        usuario_id,
                        cantidad: 0,
                        fecha_devolucion: new Date(fecha_devolucion),
                        observaciones,
                        estado: 'ACTIVO',
                        detalles: {
                            create: items.map(item => ({
                                inventario_id: item.inventario_id,
                                cantidad: parseInt(item.cantidad),
                            }))
                        }
                    },
                    include: { detalles: true }
                });

                for (const detalle of prestamo.detalles) {
                    await tx.inventario.update({
                        where: { id: detalle.inventario_id },
                        data: {
                            cantidad_disponible: { decrement: detalle.cantidad },
                        }
                    });

                    await tx.movimiento.create({
                        data: {
                            inventario_id: detalle.inventario_id,
                            tipo: 'PRESTAMO',
                            cantidad: detalle.cantidad,
                            persona_id,
                            usuario_id,
                            prestamo_id: prestamo.id,
                            observaciones: `Préstamo múltiple. ID: ${prestamo.id}`
                        }
                    });
                }

                return prestamo;
            });

            res.status(201).json({ status: "success", data: resultado });
        } catch (error) {
            logger.error("Error en prestamos.createLote:", error);
            res.status(400).json({ status: "error", mensaje: error.message || "Error al procesar los préstamos" });
        }
    },

    registrarDevolucion: async (req, res) => {
        const { id } = req.params;
        const { observaciones_dev } = req.body;
        const usuario_id = req.usuario.id;

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const prestamo = await tx.prestamo.findUnique({
                    where: { id },
                    include: { detalles: true }
                });
                if (!prestamo) throw new Error("Préstamo no encontrado.");
                if (prestamo.estado === 'DEVUELTO') throw new Error("Ya fue devuelto.");

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

                if (prestamo.detalles && prestamo.detalles.length > 0) {
                    for (const detalle of prestamo.detalles) {
                        await tx.inventario.update({
                            where: { id: detalle.inventario_id },
                            data: {
                                cantidad_disponible: { increment: detalle.cantidad },
                            }
                        });
                        await tx.movimiento.create({
                            data: {
                                inventario_id: detalle.inventario_id,
                                tipo: 'DEVUELTO',
                                cantidad: detalle.cantidad,
                                persona_id: prestamo.persona_id,
                                usuario_id,
                                prestamo_id: prestamo.id,
                                observaciones: `Devolución préstamo múltiple ID: ${id}`
                            }
                        });
                    }
                } else {
                    const cantDevolver = prestamo.cantidad;
                    await tx.inventario.update({
                        where: { id: prestamo.inventario_id },
                        data: {
                            cantidad_disponible: { increment: cantDevolver },
                        }
                    });
                    await tx.movimiento.create({
                        data: {
                            inventario_id: prestamo.inventario_id,
                            tipo: 'DEVUELTO',
                            cantidad: cantDevolver,
                            persona_id: prestamo.persona_id,
                            usuario_id,
                            prestamo_id: prestamo.id,
                            observaciones: `Devolución de préstamo ID: ${id}`
                        }
                    });
                }

                return actualizado;
            });

            res.json(resultado);
        } catch (error) {
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { cantidad, observaciones, fecha_devolucion, estado, persona_id, instructor_id, usuario_id } = req.body;

            const prestamoActual = await prisma.prestamo.findUnique({ where: { id: req.params.id } });
            if (!prestamoActual) return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });

            const resultado = await prisma.$transaction(async (tx) => {
                const payload = {};
                if (observaciones !== undefined) payload.observaciones = observaciones;
                if (estado !== undefined) payload.estado = estado;
                if (persona_id !== undefined) payload.persona_id = persona_id;
                if (instructor_id !== undefined) payload.instructor_id = instructor_id;
                if (usuario_id !== undefined) payload.usuario_id = usuario_id;
                if (fecha_devolucion !== undefined) {
                    payload.fecha_devolucion = fecha_devolucion ? new Date(fecha_devolucion) : null;
                }

                if (cantidad !== undefined && Number(cantidad) !== prestamoActual.cantidad) {
                    const nuevaCantidad = Number(cantidad);
                    const diff = nuevaCantidad - prestamoActual.cantidad;
                    payload.cantidad = nuevaCantidad;

                    if (prestamoActual.estado === 'ACTIVO') {
                        const articulo = await tx.inventario.findUnique({ where: { id: prestamoActual.inventario_id } });
                        if (diff > 0 && articulo.cantidad_disponible < diff) {
                            throw new Error(`Stock insuficiente. Disponible: ${articulo.cantidad_disponible}, necesita: ${diff} más.`);
                        }
                        await tx.inventario.update({
                            where: { id: prestamoActual.inventario_id },
                            data: {
                                cantidad_disponible: { decrement: diff },
                            }
                        });
                    }
                }

                if (Object.keys(payload).length === 0) {
                    throw new Error("No hay campos para actualizar");
                }

                return await tx.prestamo.update({
                    where: { id: req.params.id },
                    data: payload,
                });
            });

            res.json(resultado);
        } catch (error) {
            logger.error("Error al actualizar préstamo:", { error: error.message, stack: error.stack, id: req.params.id, body: req.body });
            const status = error.message.includes("No hay campos") || error.message.includes("Stock insuficiente") ? 400 : 500;
            res.status(status).json({ status: "error", mensaje: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: includeDetalles()
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
                include: { movimientos: true, detalles: true }
            });
            if (!prestamo) return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });

            await prisma.$transaction(async (tx) => {
                if (prestamo.estado === 'ACTIVO') {
                    if (prestamo.detalles && prestamo.detalles.length > 0) {
                        for (const detalle of prestamo.detalles) {
                            await tx.inventario.update({
                                where: { id: detalle.inventario_id },
                                data: {
                                    cantidad_disponible: { increment: detalle.cantidad },
                                }
                            });
                        }
                    } else if (prestamo.inventario_id) {
                        await tx.inventario.update({
                            where: { id: prestamo.inventario_id },
                            data: {
                                cantidad_disponible: { increment: prestamo.cantidad },
                            }
                        });
                    }
                }
                if (prestamo.movimientos?.length > 0) {
                    await tx.movimiento.deleteMany({ where: { prestamo_id: prestamo.id } });
                }
                await tx.prestamo.delete({ where: { id: prestamo.id } });
            });
            res.json({ message: "Préstamo eliminado correctamente. Stock restaurado." });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar el préstamo" });
        }
    },

    generarPDF: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: {
                    inventario: { include: { categoria: true } },
                    detalles: {
                        include: {
                            inventario: { include: { categoria: true } }
                        }
                    },
                    persona: true,
                    instructor: { select: { id: true, nombres: true, apellidos: true } },
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                }
            });
            if (!prestamo) return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });

            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=prestamo-${prestamo.id}.pdf`);
            doc.pipe(res);

            doc.fontSize(22).font('Helvetica-Bold').text('COMPROBANTE DE PRÉSTAMO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Fecha: ${new Date().toLocaleDateString('es-DO')}`, { align: 'right' });
            doc.text(`ID: ${prestamo.id}`, { align: 'right' });
            doc.moveDown(2);

            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
            doc.moveDown();

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('DATOS DEL PRÉSTAMO');
            doc.moveDown(0.5);
            const startX = 50;
            let currentY = doc.y;

            doc.fontSize(10).font('Helvetica').fillColor('#555');
            doc.text('Estado:', startX, currentY, { continued: true });
            doc.fillColor('#333').text(` ${prestamo.estado}`, { continued: false });

            currentY = doc.y;
            doc.fillColor('#555').text('Fecha de préstamo:', startX, currentY, { continued: true });
            doc.fillColor('#333').text(` ${prestamo.fecha_prestamo ? new Date(prestamo.fecha_prestamo).toLocaleDateString('es-DO') : 'N/A'}`, { continued: false });

            if (prestamo.fecha_devolucion) {
                currentY = doc.y;
                doc.fillColor('#555').text('Fecha de devolución:', startX, currentY, { continued: true });
                doc.fillColor('#333').text(` ${new Date(prestamo.fecha_devolucion).toLocaleDateString('es-DO')}`, { continued: false });
            }

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
            doc.moveDown();

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('ESTUDIANTE');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Nombre: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.persona?.nombres || ''} ${prestamo.persona?.apellidos || ''}`);
            doc.fillColor('#555').text(`Matrícula: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.persona?.matricula || 'N/A'}`);
            doc.fillColor('#555').text(`Curso: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.persona?.curso || 'N/A'}`);

            if (prestamo.instructor) {
                doc.moveDown();
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('INSTRUCTOR / PROFESOR');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Nombre: `, { continued: true });
                doc.fillColor('#333').text(`${prestamo.instructor.nombres} ${prestamo.instructor.apellidos}`);
            }

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
            doc.moveDown();

            const articulos = prestamo.detalles && prestamo.detalles.length > 0
                ? prestamo.detalles
                : prestamo.inventario
                    ? [{ inventario: prestamo.inventario, cantidad: prestamo.cantidad }]
                    : [];

            if (articulos.length === 1) {
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('HERRAMIENTA');
                doc.moveDown(0.5);
                const art = articulos[0];
                doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Artículo: `, { continued: true });
                doc.fillColor('#333').text(`${art.inventario?.nombre || ''}`);
                doc.fillColor('#555').text(`Código: `, { continued: true });
                doc.fillColor('#333').text(`${art.inventario?.codigo || ''}`);
                doc.fillColor('#555').text(`Categoría: `, { continued: true });
                doc.fillColor('#333').text(`${art.inventario?.categoria?.nombre || 'N/A'}`);
                doc.fillColor('#555').text(`Cantidad: `, { continued: true });
                doc.fillColor('#333').text(`${art.cantidad}`);
            } else {
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('HERRAMIENTAS');
                doc.moveDown(0.5);
                articulos.forEach((art, idx) => {
                    doc.fontSize(10).font('Helvetica').fillColor('#555').text(`${idx + 1}. `, { continued: true });
                    doc.fillColor('#333').text(`${art.inventario?.nombre || ''}`, { continued: true });
                    doc.fillColor('#555').text(` x`, { continued: true });
                    doc.fillColor('#333').text(`${art.cantidad}`);
                });
            }

            if (prestamo.observaciones) {
                doc.moveDown();
                doc.fontSize(10).font('Helvetica').fillColor('#555').text('Observaciones:', { continued: true });
                doc.fillColor('#333').text(` ${prestamo.observaciones}`);
            }

            doc.moveDown(3);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
            doc.moveDown(1.5);

            doc.fontSize(8).font('Helvetica').fillColor('#999').text('Este documento es un comprobante de préstamo de herramientas.', { align: 'center' });
            doc.text('Debe presentarse al momento de la devolución.', { align: 'center' });
            doc.text(`Generado por: ${prestamo.usuario?.nombre || prestamo.usuario?.usuario || 'Sistema'}`, { align: 'center' });

            doc.end();
        } catch (error) {
            logger.error("Error al generar PDF:", error);
            res.status(500).json({ status: "error", mensaje: "Error al generar el PDF" });
        }
    }
};

module.exports = prestamoController;
