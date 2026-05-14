const { prisma } = require('../db');
const PDFDocument = require('pdfkit');
const path = require('path');

function filtroFechaPrestamo(fechaInicio, fechaFin) {
  const f = {};
  if (fechaInicio) f.gte = new Date(fechaInicio);
  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    f.lte = fin;
  }
  return Object.keys(f).length > 0 ? { fecha_prestamo: f } : {};
}

function formatoFecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatoFechaCorta(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── PDF helper (portada + estilo profesional) ─────────────
function generarPDF(res, titulo, fechaInicio, fechaFin, columnas, filas, color = '#10367d') {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${titulo.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width - 80;
  const marginX = 40;
  const pageH = doc.page.height;
  const colorClaro = '#e8edf5';
  const logoPath = path.join(__dirname, '../uploads/logo.png');

  // ── Portada (página 1) ──────────────────────────────────
  function portada() {
    // Fondo degradado simulado con barras verticales
    const pasos = 80;
    const altoPaso = pageH / pasos;
    for (let i = 0; i < pasos; i++) {
      const t = i / pasos;
      const r = Math.round(16 + t * 9);
      const g = Math.round(54 + t * 7);
      const b = Math.round(125 + t * 72);
      const c = `rgb(${r},${g},${b})`;
      doc.rect(0, i * altoPaso, doc.page.width, altoPaso + 1).fill(c);
    }

    // Logo grande y centrado
    try {
      const logoSize = 160;
      doc.image(logoPath, (doc.page.width - logoSize) / 2, 100, { width: logoSize });
    } catch {}

    // Línea decorativa
    const cx = doc.page.width / 2;
    doc.moveTo(cx - 80, 300).lineTo(cx + 80, 300).lineWidth(2).strokeColor('rgba(255,255,255,0.45)').stroke();

    // Título del reporte
    doc.font('Helvetica-Bold').fontSize(30).fillColor('#fff')
      .text(titulo, marginX, 330, { align: 'center', width: pageW });

    // Subtítulo
    doc.font('Helvetica').fontSize(14).fillColor('rgba(255,255,255,0.7)')
      .text('Sistema de Gestión de Préstamos', marginX, 380, { align: 'center', width: pageW });

    // Fecha de generación
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.5)')
      .text(`Generado: ${formatoFecha(new Date())}`, marginX, 430, { align: 'center', width: pageW });

    if (fechaInicio || fechaFin) {
      doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.45)')
        .text(`Período: ${fechaInicio ? formatoFechaCorta(fechaInicio) : '—'} al ${fechaFin ? formatoFechaCorta(fechaFin) : '—'}`, marginX, 450, { align: 'center', width: pageW });
    }

    doc.addPage();
  }

  // ── Encabezado de páginas de datos ──────────────────────
  function encabezadoPagina() {
    const yTop = 30;
    doc.rect(marginX, yTop, pageW, 6).fill(color);
    try {
      doc.image(logoPath, marginX, yTop + 10, { height: 32 });
    } catch {}
    const textX = marginX + 46;
    doc.fontSize(20).font('Helvetica-Bold').fillColor(color).text('Sistema de Gestión de Préstamos', textX, yTop + 14);
    doc.fontSize(9).font('Helvetica').fillColor('#888').text(`Generado: ${formatoFecha(new Date())}`, textX, yTop + 38);
    if (fechaInicio || fechaFin) {
      doc.fontSize(8).font('Helvetica').fillColor('#888')
        .text(`Período: ${fechaInicio ? formatoFechaCorta(fechaInicio) : '—'} al ${fechaFin ? formatoFechaCorta(fechaFin) : '—'}`, textX, yTop + 51);
    }
    let yy = yTop + (fechaInicio || fechaFin ? 66 : 56);
    doc.moveTo(marginX, yy).lineTo(marginX + pageW, yy).lineWidth(1.5).strokeColor(color).stroke();
    yy += 16;
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#333').text(titulo, marginX, yy);
    yy += 24;
    return yy;
  }

  function piePagina() {
    const totalPages = doc.bufferedPageRange().count;
    const contentPages = totalPages - 1;
    for (let i = 0; i < totalPages; i++) {
      if (i === 0) continue;
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor('#aaa')
        .text(`Página ${i} de ${contentPages}`, marginX, doc.page.height - 35, { align: 'center', width: pageW });
      doc.fontSize(7).font('Helvetica').fillColor('#ccc')
        .text(titulo, marginX, doc.page.height - 25, { align: 'center', width: pageW });
      doc.rect(marginX, doc.page.height - 42, pageW, 0.5).fill('#ddd');
    }
  }

  // ── Render ───────────────────────────────────────────────
  portada();

  let y = encabezadoPagina();
  const colW = pageW / columnas.length;
  const rowH = 24;

  function tablaHeader(yy) {
    doc.roundedRect(marginX, yy, pageW, rowH, 3).fill(color);
    columnas.forEach((col, i) => {
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
        .text(col, marginX + colW * i + 8, yy + 7, { width: colW - 12, align: 'left' });
    });
    return yy + rowH;
  }

  y = tablaHeader(y);

  let turno = false;
  for (const fila of filas) {
    if (y + rowH > doc.page.height - 55) {
      piePagina();
      doc.addPage();
      y = encabezadoPagina();
      y = tablaHeader(y);
    }
    const bgColor = turno ? colorClaro : '#fff';
    doc.rect(marginX, y, pageW, rowH).fill(bgColor);
    turno = !turno;
    columnas.forEach((col, i) => {
      const val = fila[col] !== undefined && fila[col] !== null ? String(fila[col]) : '';
      doc.fillColor('#333').fontSize(8.5).font('Helvetica')
        .text(val, marginX + colW * i + 8, y + 7, { width: colW - 12, align: 'left' });
    });
    y += rowH;
  }

  y += 8;
  doc.moveTo(marginX, y).lineTo(marginX + pageW, y).lineWidth(1).strokeColor('#ddd').stroke();
  y += 6;
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999')
    .text(`${filas.length} registro(s) encontrado(s)`, marginX, y, { align: 'right', width: pageW });

  piePagina();
  doc.end();
}

const reportesController = {
  bajoStock: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const whereFecha = filtroFechaPrestamo(fechaInicio, fechaFin);
      const where = { cantidad: { lte: 2 } };

      if (Object.keys(whereFecha).length > 0) {
        where.prestamos = { some: whereFecha };
      }

      const items = await prisma.inventario.findMany({
        where,
        include: { categoria: true, ubicacion: true },
        orderBy: { cantidad: 'asc' }
      });
      res.json(items);
    } catch (error) {
      res.status(500).json({ status: 'error', mensaje: 'Error al obtener reporte de bajo stock' });
    }
  },

  masPrestados: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, limite = 10 } = req.query;
      const whereFecha = filtroFechaPrestamo(fechaInicio, fechaFin);

      const resultados = await prisma.prestamo.groupBy({
        by: ['inventario_id'],
        _count: { id: true },
        _sum: { cantidad: true },
        where: { ...whereFecha },
        orderBy: { _count: { id: 'desc' } },
        take: parseInt(limite),
      });

      const ids = resultados.map(r => r.inventario_id);
      const inventarios = await prisma.inventario.findMany({
        where: { id: { in: ids } },
        include: { categoria: true }
      });
      const mapa = Object.fromEntries(inventarios.map(i => [i.id, i]));

      const data = resultados.map(r => ({
        ...mapa[r.inventario_id],
        total_prestamos: r._count.id,
        total_prestado: r._sum.cantidad,
      }));

      res.json(data);
    } catch (error) {
      res.status(500).json({ status: 'error', mensaje: 'Error al obtener reporte' });
    }
  },

  menosPrestados: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, limite = 10 } = req.query;
      const whereFecha = filtroFechaPrestamo(fechaInicio, fechaFin);

      const resultados = await prisma.prestamo.groupBy({
        by: ['inventario_id'],
        _count: { id: true },
        _sum: { cantidad: true },
        where: { ...whereFecha },
        orderBy: { _count: { id: 'asc' } },
        take: parseInt(limite),
      });

      const ids = resultados.map(r => r.inventario_id);
      const inventarios = await prisma.inventario.findMany({
        where: { id: { in: ids } },
        include: { categoria: true }
      });
      const mapa = Object.fromEntries(inventarios.map(i => [i.id, i]));

      const data = resultados.map(r => ({
        ...mapa[r.inventario_id],
        total_prestamos: r._count.id,
        total_prestado: r._sum.cantidad,
      }));

      res.json(data);
    } catch (error) {
      res.status(500).json({ status: 'error', mensaje: 'Error al obtener reporte' });
    }
  },

  pdf: async (req, res) => {
    try {
      const { tipo, fechaInicio, fechaFin } = req.query;
      const whereFecha = filtroFechaPrestamo(fechaInicio, fechaFin);

      if (tipo === 'bajo-stock') {
        const where = { cantidad: { lte: 2 } };
        if (Object.keys(whereFecha).length > 0) {
          where.prestamos = { some: whereFecha };
        }
        const items = await prisma.inventario.findMany({
          where,
          include: { categoria: true, ubicacion: true },
          orderBy: { cantidad: 'asc' }
        });
        const filas = items.map(i => ({
          Código: i.codigo,
          Nombre: i.nombre,
          Categoría: i.categoria?.nombre || '—',
          Stock: String(i.cantidad),
          Estado: i.estado || '—',
        }));
        generarPDF(res, 'Reporte de Bajo Stock', fechaInicio, fechaFin,
          ['Código', 'Nombre', 'Categoría', 'Stock', 'Estado'], filas);
      } else if (tipo === 'mas-prestados') {
        const resultados = await prisma.prestamo.groupBy({
          by: ['inventario_id'],
          _count: { id: true },
          _sum: { cantidad: true },
          where: { ...whereFecha },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        });
        const ids = resultados.map(r => r.inventario_id);
        const inventarios = await prisma.inventario.findMany({
          where: { id: { in: ids } },
          include: { categoria: true }
        });
        const mapa = Object.fromEntries(inventarios.map(i => [i.id, i]));
        const filas = resultados.map(r => ({
          Código: mapa[r.inventario_id]?.codigo || '—',
          Nombre: mapa[r.inventario_id]?.nombre || '—',
          Categoría: mapa[r.inventario_id]?.categoria?.nombre || '—',
          'Veces prestado': String(r._count.id),
          'Total unidades': String(r._sum.cantidad),
        }));
        generarPDF(res, 'Reporte de Más Prestados', fechaInicio, fechaFin,
          ['Código', 'Nombre', 'Categoría', 'Veces prestado', 'Total unidades'], filas);
      } else if (tipo === 'menos-prestados') {
        const resultados = await prisma.prestamo.groupBy({
          by: ['inventario_id'],
          _count: { id: true },
          _sum: { cantidad: true },
          where: { ...whereFecha },
          orderBy: { _count: { id: 'asc' } },
          take: 20,
        });
        const ids = resultados.map(r => r.inventario_id);
        const inventarios = await prisma.inventario.findMany({
          where: { id: { in: ids } },
          include: { categoria: true }
        });
        const mapa = Object.fromEntries(inventarios.map(i => [i.id, i]));
        const filas = resultados.map(r => ({
          Código: mapa[r.inventario_id]?.codigo || '—',
          Nombre: mapa[r.inventario_id]?.nombre || '—',
          Categoría: mapa[r.inventario_id]?.categoria?.nombre || '—',
          'Veces prestado': String(r._count.id),
          'Total unidades': String(r._sum.cantidad),
        }));
        generarPDF(res, 'Reporte de Menos Prestados', fechaInicio, fechaFin,
          ['Código', 'Nombre', 'Categoría', 'Veces prestado', 'Total unidades'], filas);
      } else {
        res.status(400).json({ status: 'error', mensaje: 'Tipo de reporte inválido' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', mensaje: 'Error al generar PDF' });
    }
  }
};

module.exports = reportesController;
