const { prisma } = require('../db');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

async function marcarVencidos() {
    try {
        await prisma.prestamo.updateMany({
            where: {
                estado: 'PENDIENTE',
                fecha_devolucion: { lt: new Date(Date.now() - 60000) },
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
        if (!persona_id && !instructor_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un estudiante o profesor." });
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
                        inventario: { connect: { id: inventario_id } },
                        ...(persona_id && { persona: { connect: { id: persona_id } } }),
                        ...(instructor_id && { instructor: { connect: { id: instructor_id } } }),
                        usuario: { connect: { id: usuario_id } },
                        cantidad: cantSolicitada,
                        fecha_devolucion: new Date(fecha_devolucion),
                        observaciones,
                        estado: 'PENDIENTE'
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
        if (!persona_id && !instructor_id) return res.status(400).json({ status: "error", mensaje: "Debes seleccionar un estudiante o profesor." });
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
                        ...(persona_id && { persona: { connect: { id: persona_id } } }),
                        ...(instructor_id && { instructor: { connect: { id: instructor_id } } }),
                        usuario: { connect: { id: usuario_id } },
                        cantidad: 0,
                        fecha_devolucion: new Date(fecha_devolucion),
                        observaciones,
                        estado: 'PENDIENTE',
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
    } catch(error) {
        logger.error("Error en prestamos.createLote:", error);
        res.status(400).json({ status: "error", mensaje: error.message || "Error al procesar los préstamos" });
    }
},

    registrarDevolucion: async (req, res) => {
        const { id } = req.params;
        const { observaciones_dev, items_devolucion } = req.body;
        const usuario_id = req.usuario.id;

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                const prestamo = await tx.prestamo.findUnique({
                    where: { id },
                    include: { detalles: true, inventario: true }
                });
                if (!prestamo) throw new Error("Préstamo no encontrado.");
                if (prestamo.estado === 'DEVUELTO') throw new Error("Ya fue devuelto.");
                if (prestamo.estado === 'PERDIDO') throw new Error("Ya fue marcado como perdido.");

                const esMultiItem = prestamo.detalles && prestamo.detalles.length > 0;
                const items = esMultiItem ? prestamo.detalles : [{ inventario_id: prestamo.inventario_id, cantidad: prestamo.cantidad, id: 'directo' }];

                if (items_devolucion && Array.isArray(items_devolucion) && items_devolucion.length > 0) {
                    const devolucionMap = {};
                    for (const item of items) {
                        devolucionMap[item.inventario_id] = { buena: 0, danada: 0, perdida: 0, obsBuena: '', obsDanada: '', obsPerdida: '' };
                    }

                    for (const devItem of items_devolucion) {
                        const invId = devItem.inventario_id;
                        if (!devolucionMap.hasOwnProperty(invId)) continue;
                        const estado = (devItem.estado || 'BUEN_ESTADO').toUpperCase();
                        const cant = parseInt(devItem.cantidad) || 0;
                        const obs = `${devItem.observaciones || ''}`.trim();

                        if (estado === 'BUEN_ESTADO') {
                            devolucionMap[invId].buena += cant;
                            if (obs) devolucionMap[invId].obsBuena = obs;
                            if (cant > 0) {
                                await tx.inventario.update({
                                    where: { id: invId },
                                    data: { cantidad_disponible: { increment: cant } }
                                });
                                await tx.movimiento.create({
                                    data: {
                                        inventario_id: invId,
                                        tipo: 'DEVUELTO',
                                        cantidad: cant,
                                        persona_id: prestamo.persona_id,
                                        usuario_id,
                                        prestamo_id: prestamo.id,
                                        ubicacion_origen_id: null,
                                        ubicacion_destino_id: null,
                                        observaciones: `Devolución (buen estado) x${cant}. ${obs}`
                                    }
                                });
                            }
                        } else if (estado === 'MAL_ESTADO') {
                            devolucionMap[invId].danada += cant;
                            if (obs) devolucionMap[invId].obsDanada = obs;
                            if (cant > 0) {
                                await tx.inventario.update({
                                    where: { id: invId },
                                    data: {
                                        cantidad_danada: { increment: cant }
                                    }
                                });
                                await tx.movimiento.create({
                                    data: {
                                        inventario_id: invId,
                                        tipo: 'DEVUELTO_DANADO',
                                        cantidad: cant,
                                        persona_id: prestamo.persona_id,
                                        usuario_id,
                                        prestamo_id: prestamo.id,
                                        ubicacion_origen_id: null,
                                        ubicacion_destino_id: null,
                                        observaciones: `Devolución (mal estado/dañado) x${cant}. ${obs}`
                                    }
                                });
                            }
                        } else if (estado === 'PERDIDO') {
                            devolucionMap[invId].perdida += cant;
                            if (obs) devolucionMap[invId].obsPerdida = obs;
                            if (cant > 0) {
                                await tx.inventario.update({
                                    where: { id: invId },
                                    data: {
                                        cantidad_total: { decrement: cant }
                                    }
                                });
                                await tx.movimiento.create({
                                    data: {
                                        inventario_id: invId,
                                        tipo: 'PERDIDO',
                                        cantidad: cant,
                                        persona_id: prestamo.persona_id,
                                        usuario_id,
                                        prestamo_id: prestamo.id,
                                        ubicacion_origen_id: null,
                                        ubicacion_destino_id: null,
                                        observaciones: `Artículo perdido/no aparece x${cant}. ${obs}`
                                    }
                                });
                            }
                        }
                    }

                    let todosPerdidos = true;
                    let hayAlgunDevuelto = false;
                    for (const invId of Object.keys(devolucionMap)) {
                        const d = devolucionMap[invId];
                        const item = items.find(i => i.inventario_id === invId);
                        if (!item) continue;
                        if (d.buena > 0 || d.danada > 0) hayAlgunDevuelto = true;
                        if (d.buena + d.danada + d.perdida < item.cantidad) todosPerdidos = false;
                    }

                    const nuevoEstado = todosPerdidos && !hayAlgunDevuelto ? 'PERDIDO' : 'DEVUELTO';

                    for (const invId of Object.keys(devolucionMap)) {
                        const d = devolucionMap[invId];
                        const item = items.find(i => i.inventario_id === invId);
                        if (!item || item.id === 'directo') continue;

                        const partes = [];
                        if (d.buena > 0) partes.push(`Buena: ${d.buena}`);
                        if (d.danada > 0) partes.push(`Dañada: ${d.danada}`);
                        if (d.perdida > 0) partes.push(`Perdida: ${d.perdida}`);

                        const obsParts = [];
                        if (d.obsBuena) obsParts.push(`Buena: ${d.obsBuena}`);
                        if (d.obsDanada) obsParts.push(`Dañada: ${d.obsDanada}`);
                        if (d.obsPerdida) obsParts.push(`Perdida: ${d.obsPerdida}`);

                        await tx.prestamoDetalle.update({
                            where: { id: item.id },
                            data: {
                                cantidad_devuelta_buena: d.buena,
                                cantidad_devuelta_danada: d.danada,
                                cantidad_perdida: d.perdida,
                                estado_devolucion: d.perdida === item.cantidad ? 'PERDIDO' : d.danada === item.cantidad ? 'MAL_ESTADO' : 'BUEN_ESTADO',
                                observaciones_devolucion: obsParts.length > 0 ? obsParts.join(' | ') : null
                            }
                        });
                    }

                    const obsExtra = observaciones_dev ? ` | DEV: ${observaciones_dev}` : '';
                    const resumenItems = Object.entries(devolucionMap).map(([invId, d]) => {
                        const partes = [];
                        if (d.buena > 0) partes.push(`Buena:${d.buena}`);
                        if (d.danada > 0) partes.push(`Dañada:${d.danada}`);
                        if (d.perdida > 0) partes.push(`Perdida:${d.perdida}`);
                        return `${invId.substring(0, 8)}[${partes.join(', ')}]`;
                    }).join(', ');
                    const actualizado = await tx.prestamo.update({
                        where: { id },
                        data: {
                            estado: nuevoEstado,
                            fecha_devolucion: new Date(),
                            observaciones: `${prestamo.observaciones || ''}${obsExtra} | Resumen: ${resumenItems}`
                        },
                        include: { detalles: true }
                    });
                    return actualizado;
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
                            ubicacion_origen_id: null,
                            ubicacion_destino_id: null,
                            observaciones: `Devolución de préstamo ID: ${id}${observaciones_dev ? ` | ${observaciones_dev}` : ''}`
                        }
                    });

                    return await tx.prestamo.update({
                        where: { id },
                        data: {
                            estado: 'DEVUELTO',
                            fecha_devolucion: new Date(),
                            observaciones: observaciones_dev
                                ? `${prestamo.observaciones || ''} | DEV: ${observaciones_dev}`
                                : prestamo.observaciones
                        }
                    });
                }
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
                    if (persona_id !== undefined) payload.persona = persona_id ? { connect: { id: persona_id } } : { disconnect: true };
                    if (instructor_id !== undefined) payload.instructor = instructor_id ? { connect: { id: instructor_id } } : { disconnect: true };
                    if (usuario_id !== undefined) payload.usuario = { connect: { id: usuario_id } };
                    if (fecha_devolucion !== undefined) {
                        payload.fecha_devolucion = fecha_devolucion ? new Date(fecha_devolucion) : null;
                    }

                    if (cantidad !== undefined && Number(cantidad) !== prestamoActual.cantidad) {
                        const nuevaCantidad = Number(cantidad);
                        const diff = nuevaCantidad - prestamoActual.cantidad;
                        payload.cantidad = nuevaCantidad;

                        if (prestamoActual.estado === 'PENDIENTE' && prestamoActual.inventario_id) {
                            const articulo = await tx.inventario.findUnique({ where: { id: prestamoActual.inventario_id } });
                            if (!articulo) throw new Error("Artículo del préstamo no encontrado");
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
                            if (prestamo.estado === 'PENDIENTE') {
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

                            await prisma.prestamo.update({
                                where: { id: prestamo.id },
                                data: { veces_impreso: { increment: 1 } }
                            });
                            const esDuplicado = prestamo.veces_impreso > 0;

                            const doc = new PDFDocument({ size: 'A4', margin: 50 });
                            res.setHeader('Content-Type', 'application/pdf');
                            res.setHeader('Content-Disposition', `inline; filename=prestamo-${prestamo.id}.pdf`);
                            doc.pipe(res);

                            doc.fontSize(22).font('Helvetica-Bold').fillColor('#333').text('COMPROBANTE DE PRÉSTAMO', { align: 'center' });
                            if (esDuplicado) {
                                doc.moveDown(0.3);
                                doc.fontSize(14).font('Helvetica-Bold').fillColor('#cc0000').text('** DUPLICADO **', { align: 'center' });
                            }
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
                            doc.text('Fecha de préstamo:', startX, currentY, { continued: true });
                            doc.fillColor('#333').text(` ${prestamo.fecha_prestamo ? new Date(prestamo.fecha_prestamo).toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A'}`, { continued: false });

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
                                doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('ARTÍCULO');
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

                                if (art.estado_devolucion) {
                                    doc.fillColor('#555').text(`Estado devolución: `, { continued: true });
                                    const estadoLabel = art.estado_devolucion === 'BUEN_ESTADO' ? 'Buen estado' :
                                        art.estado_devolucion === 'MAL_ESTADO' ? 'Dañado' : 'Perdido';
                                    doc.fillColor('#333').text(`${estadoLabel}`);
                                }
                                if (art.cantidad_devuelta_buena > 0) {
                                    doc.fillColor('#555').text(`Devuelta buena: `, { continued: true });
                                    doc.fillColor('#333').text(`${art.cantidad_devuelta_buena}`);
                                }
                                if (art.cantidad_devuelta_danada > 0) {
                                    doc.fillColor('#555').text(`Devuelta dañada: `, { continued: true });
                                    doc.fillColor('#333').text(`${art.cantidad_devuelta_danada}`);
                                }
                                if (art.cantidad_perdida > 0) {
                                    doc.fillColor('#555').text(`Perdida: `, { continued: true });
                                    doc.fillColor('#333').text(`${art.cantidad_perdida}`);
                                }
                            } else {
                                doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('ARTÍCULOS');
                                doc.moveDown(0.5);
                                articulos.forEach((art, idx) => {
                                    doc.fontSize(10).font('Helvetica').fillColor('#555').text(`${idx + 1}. `, { continued: true });
                                    doc.fillColor('#333').text(`${art.inventario?.nombre || ''}`, { continued: true });
                                    doc.fillColor('#555').text(` x`, { continued: true });
                                    doc.fillColor('#333').text(`${art.cantidad}`);

                                    if (art.estado_devolucion) {
                                        const estadoLabel = art.estado_devolucion === 'BUEN_ESTADO' ? '✓Buena' :
                                            art.estado_devolucion === 'MAL_ESTADO' ? '⚠Dañada' : '✕Perdida';
                                        doc.fillColor('#333').text(` (${estadoLabel})`);
                                    }
                                    doc.moveDown(0.3);

                                    if (art.cantidad_devuelta_buena > 0) {
                                        doc.fontSize(8).font('Helvetica').fillColor('#333').text(`   Buena: ${art.cantidad_devuelta_buena}`);
                                    }
                                    if (art.cantidad_devuelta_danada > 0) {
                                        doc.fontSize(8).font('Helvetica').fillColor('#333').text(`   Dañada: ${art.cantidad_devuelta_danada}`);
                                    }
                                    if (art.cantidad_perdida > 0) {
                                        doc.fontSize(8).font('Helvetica').fillColor('#333').text(`   Perdida: ${art.cantidad_perdida}`);
                                    }
                                    if (art.observaciones_devolucion) {
                                        doc.fontSize(8).font('Helvetica').fillColor('#666').text(`   Obs: ${art.observaciones_devolucion}`);
                                    }
                                    doc.moveDown(0.2);
                                    doc.fontSize(10);
                                });
                            }

                            if (prestamo.observaciones) {
                                doc.moveDown();
                                doc.fontSize(10).font('Helvetica').fillColor('#555').text('Observaciones:', { continued: true });
                                doc.fillColor('#333').text(` ${prestamo.observaciones}`);
                            }

                            doc.moveDown(2);
                            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
                            doc.moveDown(1.5);

                            if (prestamo.fecha_devolucion) {
                                doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text(
                                    `Fecha de devolución: ${new Date(prestamo.fecha_devolucion).toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short' })}`,
                                    { align: 'center' }
                                );
                                doc.moveDown(2);
                            }

                            doc.fontSize(8).font('Helvetica').fillColor('#999').text('Este documento es un comprobante de préstamo.', { align: 'center' });
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
