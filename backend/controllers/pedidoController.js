const { prisma } = require('../db');
const logger = require('../utils/logger');
const { generarCodigoAleatorio } = require('../utils/generadores');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');
const PDFDocument = require('pdfkit');
const path = require('path');

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
                        estado: 'EN_REVISION',
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
            const { proveedor, observaciones, prioridad, estado, fecha_entrega, detalles } = req.body;
            const data = {};
            if (proveedor !== undefined) data.proveedor = proveedor;
            if (observaciones !== undefined) data.observaciones = observaciones;
            if (prioridad !== undefined) data.prioridad = prioridad;
            if (estado !== undefined) data.estado = estado;
            if (fecha_entrega !== undefined) data.fecha_entrega = fecha_entrega ? new Date(fecha_entrega) : null;

            const actualizado = await prisma.$transaction(async (tx) => {
                if (detalles) {
                    await tx.detallePedido.deleteMany({ where: { pedido_id: req.params.id } });

                    const detallesProcesados = await Promise.all((detalles || []).map(async (d) => {
                        let inventario_id = d.inventario_id;
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

                    data.detalles = {
                        create: detallesProcesados
                    };
                }

                return await tx.pedido.update({
                    where: { id: req.params.id },
                    data,
                    include: {
                        detalles: {
                            include: {
                                inventario: { select: { id: true, codigo: true, nombre: true } }
                            }
                        },
                        usuario: { select: { id: true, usuario: true, nombre: true, apellido: true } }
                    }
                });
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
                if (pedido.estado !== 'PENDIENTE') throw new Error("El pedido debe estar en estado PENDIENTE para recibirlo");

                for (const detalle of pedido.detalles) {
                    const invAntes = await tx.inventario.findUnique({
                        where: { id: detalle.inventario_id },
                        select: { cantidad_disponible: true }
                    });
                    const cantidadAnterior = invAntes?.cantidad_disponible ?? 0;
                    const cantidadNueva = cantidadAnterior + detalle.cantidad;

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
                            observaciones: `Recepción de pedido ${pedido.numero_orden}: de ${cantidadAnterior} a ${cantidadNueva} uds.`
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

    generarPdf: async (req, res) => {
        try {
            const pedido = await prisma.pedido.findUnique({
                where: { id: req.params.id },
                include: {
                    usuario: { select: { nombre: true, apellido: true } },
                    detalles: {
                        include: {
                            inventario: { select: { codigo: true, nombre: true } }
                        }
                    }
                }
            });
            if (!pedido) return res.status(404).json({ status: "error", mensaje: "Pedido no encontrado" });

            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Pedido_${pedido.numero_orden}.pdf"`);
            doc.pipe(res);

            const pageW = doc.page.width - 80;
            const marginX = 40;
            const color = '#10367d';
            const logoAzul = path.join(__dirname, '../uploads/logo_azul.png');

            // ── Encabezado ──
            try { doc.image(logoAzul, marginX, 40, { width: 180 }); } catch {}
            doc.fontSize(18).font('Helvetica-Bold').fillColor(color)
                .text('ORDEN DE PEDIDO', 270, 45, { align: 'left', width: pageW - 230 });

            doc.fontSize(10).font('Helvetica').fillColor('#64748b')
                .text(`N° ${pedido.numero_orden}`, 270, 72, { align: 'left', width: pageW - 230 });

            // ── Info card ──
            const infoY = 170;
            doc.save();
            doc.roundedRect(marginX, infoY, pageW, 115, 8).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
            doc.restore();

            const col1X = marginX + 25;
            const col2X = marginX + 170;
            let iy = infoY + 20;

            function infoRow(label, value, yy) {
                doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(label, col1X, yy);
                doc.font('Helvetica-Bold').fillColor('#1e293b').text(value, col2X, yy);
                return yy + 22;
            }

            iy = infoRow('Prioridad:', pedido.prioridad || '—', iy);
            iy = infoRow('Fecha emisión:', new Date().toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short' }), iy);
            iy = infoRow('Solicitado por:', `${pedido.usuario?.nombre || ''} ${pedido.usuario?.apellido || ''}`, iy);
            if (pedido.observaciones) {
                doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Observaciones:', col1X, iy + 5);
                doc.font('Helvetica-Oblique').fillColor('#475569').text(pedido.observaciones, col1X + 130, iy + 5, { width: pageW - 155 });
                iy += 30;
            }

            // ── Tabla de herramientas ──
            const tableY = iy + 30;
            const colW = [pageW * 0.65, pageW * 0.35];
            const rowH = 22;

            doc.save();
            doc.roundedRect(marginX, tableY, pageW, rowH, 4).fill(color);
            const headers = ['Objeto', 'Cant.'];
            let hx = marginX + 10;
            headers.forEach((h, i) => {
                doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
                    .text(h, hx, tableY + 6, { width: colW[i] - 10, align: 'left' });
                hx += colW[i];
            });
            doc.restore();

            let ty = tableY + rowH;
            let turno = false;
            for (const d of pedido.detalles) {
                if (turno) doc.fillColor('#f8fafc').rect(marginX, ty, pageW, rowH).fill();
                doc.moveTo(marginX, ty + rowH).lineTo(marginX + pageW, ty + rowH).lineWidth(0.2).strokeColor('#e2e8f0').stroke();

                let vx = marginX + 10;
                const vals = [d.inventario?.nombre || '—', String(d.cantidad)];
                vals.forEach((v, i) => {
                    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(v, vx, ty + 6, { width: colW[i] - 10, align: 'left' });
                    vx += colW[i];
                });
                turno = !turno;
                ty += rowH;
            }

            // ── Totales ──
            const totalCant = pedido.detalles.reduce((s, d) => s + d.cantidad, 0);

            ty += 10;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
                .text(`Total objetos: ${pedido.detalles.length}`, marginX, ty, { width: pageW / 2 });
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
                .text(`Total unidades: ${totalCant}`, marginX + pageW / 2, ty, { width: pageW / 2 });

            // ── Pie ──
            doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
                .text('Sistema de Gestión de Préstamos - Almacén', marginX, doc.page.height - 50, { align: 'center', width: pageW });

            doc.end();
        } catch (error) {
            logger.error("Error en pedidos.generarPdf:", error);
            res.status(500).json({ status: "error", mensaje: "Error al generar PDF" });
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
