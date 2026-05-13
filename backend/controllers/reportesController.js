const { prisma } = require('../db');
const PDFDocument = require('pdfkit');

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

// ── PDF helper ────────────────────────────────────────────
function generarPDF(res, titulo, fechaInicio, fechaFin, columnas, filas, color = '#10367d') {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${titulo.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width - 80;
  let y = 40;

  doc.fontSize(22).font('Helvetica-Bold').fillColor(color).text('Sistema de Gestión de Préstamos', 40, y);
  y += 30;
  doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Generado: ${formatoFecha(new Date())}`, 40, y);
  y += 16;

  doc.moveTo(40, y).lineTo(40 + pageW, y).lineWidth(2).strokeColor(color).stroke();
  y += 20;

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#222').text(titulo, 40, y);
  y += 20;
  if (fechaInicio || fechaFin) {
    doc.fontSize(9).font('Helvetica').fillColor('#666')
      .text(`Período: ${fechaInicio ? formatoFechaCorta(fechaInicio) : '—'} al ${fechaFin ? formatoFechaCorta(fechaFin) : '—'}`, 40, y);
    y += 18;
  }

  y += 6;

  const colW = pageW / columnas.length;
  const rowH = 22;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
  doc.roundedRect(40, y, pageW, rowH, 4).fill(color);
  columnas.forEach((col, i) => {
    doc.fillColor('#fff').text(col, 40 + colW * i + 8, y + 6, { width: colW - 12, align: 'left' });
  });
  y += rowH;

  let turno = false;
  for (const fila of filas) {
    if (y + rowH > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
      doc.roundedRect(40, y, pageW, rowH, 4).fill(color);
      columnas.forEach((col, i) => {
        doc.fillColor('#fff').text(col, 40 + colW * i + 8, y + 6, { width: colW - 12, align: 'left' });
      });
      y += rowH;
    }
    doc.rect(40, y, pageW, rowH).fill(turno ? '#f5f7fa' : '#fff');
    turno = !turno;
    doc.fontSize(8.5).font('Helvetica').fillColor('#222');
    columnas.forEach((col, i) => {
      const val = fila[col] !== undefined && fila[col] !== null ? String(fila[col]) : '';
      doc.text(val, 40 + colW * i + 8, y + 6, { width: colW - 12, align: 'left' });
    });
    y += rowH;
  }

  y += 10;
  doc.moveTo(40, y).lineTo(40 + pageW, y).lineWidth(1).strokeColor('#ddd').stroke();

  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text(`Página ${i + 1} de ${paginas.count}`, 40, doc.page.height - 40, { align: 'center', width: pageW });
  }

  doc.end();
}

const reportesController = {
  bajoStock: async (req, res) => {
    try {
      const items = await prisma.inventario.findMany({
        where: { cantidad: { lte: 2 } },
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
        const items = await prisma.inventario.findMany({
          where: { cantidad: { lte: 2 } },
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
