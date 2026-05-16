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
                                { inventario: { nombre: { contains: search, mode: 'insensitive' } } }
                            ]
                        } : {}
                    ]
                },
                include: {
                    inventario: true,
                    persona: true,
                    instructor: { select: { id: true, nombres: true, apellidos: true, matricula: true } },
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                },
                orderBy: { fecha_prestamo: 'desc' }
            });
            res.json(prestamos);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al obtener los préstamos" });
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
                    instructor: { select: { id: true, nombres: true, apellidos: true } }
                },
                orderBy: { fecha_prestamo: 'asc' }
            });
            res.json(vencidos);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al obtener préstamos pendientes" });
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
                    data: { cantidad_disponible: { decrement: cantSolicitada } }
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

                const alerta = articulo.cantidad_disponible - cantSolicitada <= articulo.stock_minimo
                    ? { mensaje: `¡Alerta! ${articulo.nombre} está por debajo del stock mínimo.`, nivel: 'CRITICO' }
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

    registrarDevolucion: async (req, res) => {
        const { id } = req.params;
        const { observaciones_dev, estado_fisico } = req.body;
        const usuario_id = req.usuario.id;

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const prestamo = await tx.prestamo.findUnique({ where: { id } });
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

                const cantDevolver = prestamo.cantidad;
                if (estado_fisico === 'DAÑADO') {
                    await tx.inventario.update({
                        where: { id: prestamo.inventario_id },
                        data: {
                            cantidad_danada: { increment: cantDevolver }
                        }
                    });
                } else {
                    await tx.inventario.update({
                        where: { id: prestamo.inventario_id },
                        data: {
                            cantidad_disponible: { increment: cantDevolver }
                        }
                    });
                }

                await tx.movimiento.create({
                    data: {
                        inventario_id: prestamo.inventario_id,
                        tipo: 'DEVUELTO',
                        cantidad: prestamo.cantidad,
                        persona_id: prestamo.persona_id,
                        usuario_id,
                        prestamo_id: prestamo.id,
                        observaciones: `Devolución de préstamo ID: ${id}${estado_fisico ? ` - Estado: ${estado_fisico}` : ''}`
                    }
                });

                return actualizado;
            });

            res.json(resultado);
        } catch (error) {
            res.status(400).json({ status: "error", mensaje: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { observaciones, fecha_devolucion, estado, persona_id, instructor_id, usuario_id } = req.body;
            const payload = {};
            if (observaciones !== undefined) payload.observaciones = observaciones;
            if (estado !== undefined) payload.estado = estado;
            if (persona_id !== undefined) payload.persona_id = persona_id;
            if (instructor_id !== undefined) payload.instructor_id = instructor_id;
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
            logger.error("Error al actualizar préstamo:", { error: error.message, stack: error.stack, id: req.params.id, body: req.body });
            res.status(500).json({ status: "error", mensaje: "Error al actualizar el préstamo", detalles: [error.message] });
        }
    },

    getById: async (req, res) => {
        try {
            const prestamo = await prisma.prestamo.findUnique({
                where: { id: req.params.id },
                include: {
                    inventario: true,
                    persona: true,
                    instructor: { select: { id: true, nombres: true, apellidos: true } },
                    usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                }
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
            if (!prestamo) return res.status(404).json({ status: "error", mensaje: "Préstamo no encontrado" });

            await prisma.$transaction(async (tx) => {
                if (prestamo.estado === 'ACTIVO') {
                    await tx.inventario.update({
                        where: { id: prestamo.inventario_id },
                        data: { cantidad_disponible: { increment: prestamo.cantidad } }
                    });
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

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('HERRAMIENTA');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').fillColor('#555').text(`Artículo: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.inventario?.nombre || ''}`);
            doc.fillColor('#555').text(`Código: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.inventario?.codigo || ''}`);
            doc.fillColor('#555').text(`Categoría: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.inventario?.categoria?.nombre || 'N/A'}`);
            doc.fillColor('#555').text(`Cantidad: `, { continued: true });
            doc.fillColor('#333').text(`${prestamo.cantidad}`);

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
