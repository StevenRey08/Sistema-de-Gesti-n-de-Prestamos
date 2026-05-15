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

// ── PDF helper ─────────────────────────────────────────────
function generarPDF(res, titulo, fechaInicio, fechaFin, columnas, filas, color = '#10367d', autorNombre = 'Usuario del Sistema') {
  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${titulo.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width - 80;
  const marginX = 40;
  const colorClaro = '#f4f7fa';
  const logoAzul = path.join(__dirname, '../uploads/logo_azul.png');
  const logoBlanco = path.join(__dirname, '../uploads/logo.png');
  const pw = doc.page.width;
  const ph = doc.page.height;
  const cx = pw / 2;

  // ── Encabezado de páginas de datos (Página 2+) ───────────
  function encabezadoPagina() {
    // Eliminada la barra azul y el título por solicitud del usuario
    return 40; 
  }

  // ── Portada (Página 1 - Diseño Minimalista) ──────────────
  function renderPortada() {
    // Logo Central
    let yLogo = 120;
    try {
      doc.image(logoAzul, (pw - 250) / 2, yLogo, { width: 250 });
    } catch {}

    // Título Principal
    const yTitle = yLogo + 200;
    doc.font('Helvetica-Bold').fontSize(32).fillColor(color)
      .text(titulo.toUpperCase(), marginX, yTitle, { align: 'center', width: pageW });

    // Card de metadatos expandida
    const yBox = yTitle + 80;
    const mw = 460;
    const mh = (fechaInicio || fechaFin) ? 170 : 135;
    const mleft = cx - mw / 2;
    
    doc.save();
    doc.roundedRect(mleft, yBox, mw, mh, 15).lineWidth(0.8).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#f8fafc').roundedRect(mleft + 0.8, yBox + 0.8, mw - 1.6, mh - 1.6, 15).fill();
    doc.restore();

    function metaRow(label, value, yy) {
      doc.font('Helvetica').fontSize(14).fillColor('#64748b').text(label, mleft + 45, yy, { width: 150 });
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text(value, mleft + 210, yy, { width: 240 });
      return yy + 36;
    }

    let ly = yBox + 30;
    ly = metaRow('Elaborado por:', autorNombre, ly);
    ly = metaRow('Fecha emisión:', formatoFecha(new Date()), ly);
    if (fechaInicio || fechaFin) {
      ly = metaRow('Período:', `${fechaInicio ? formatoFechaCorta(fechaInicio) : '—'} al ${fechaFin ? formatoFechaCorta(fechaFin) : '—'}`, ly);
    }
    ly = metaRow('Tipo reporte:', titulo, ly);

    doc.addPage();
  }

  function addFooter() {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      if (i === 0) continue; // No poner pie de página de datos en la portada
      doc.switchToPage(i);
      doc.rect(marginX, ph - 45, pageW, 0.5).fill('#e2e8f0');
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
        .text('INFO-ALMACEN | Sistema de Gestión de Préstamos', marginX, ph - 35, { align: 'left', width: pageW / 2 });
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b')
        .text(`Página ${i} de ${pages.count - 1}`, marginX + pageW / 2, ph - 35, { align: 'right', width: pageW / 2 });
    }
  }

  // ── Renderizado ──────────────────────────────────────────
  renderPortada();
  
  let y = encabezadoPagina();
  const colW = pageW / columnas.length;
  const rowH = 24;

  function tablaHeader(yy) {
    doc.save();
    doc.roundedRect(marginX, yy, pageW, rowH, 4).fill(color);
    columnas.forEach((col, i) => {
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold')
        .text(col.toUpperCase(), marginX + colW * i + 10, yy + 7, { width: colW - 20, align: 'left' });
    });
    doc.restore();
    return yy + rowH;
  }

  y = tablaHeader(y);
  let turno = false;

  for (const fila of filas) {
    // Umbral de salto de página ajustado para aprovechar más espacio
    if (y + rowH > ph - 50) { 
      doc.addPage();
      y = encabezadoPagina();
      y = tablaHeader(y);
    }
    
    if (turno) {
      doc.fillColor(colorClaro).rect(marginX, y, pageW, rowH).fill();
    }
    doc.moveTo(marginX, y + rowH).lineTo(marginX + pageW, y + rowH).lineWidth(0.2).strokeColor('#eee').stroke();
    
    turno = !turno;
    columnas.forEach((col, i) => {
      const val = fila[col] !== undefined && fila[col] !== null ? String(fila[col]) : '';
      doc.fillColor('#334155').fontSize(8.5).font('Helvetica')
        .text(val, marginX + colW * i + 10, y + 7, { width: colW - 20, align: 'left', lineBreak: false });
    });
    y += rowH;
  }

  // Solo agregar página si el espacio para el resumen es crítico (menos de 30px)
  if (y + 30 > ph - 50) {
    doc.addPage();
    y = encabezadoPagina();
  }
  
  y += 10;
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
    .text(`Fin del reporte. Total de registros: ${filas.length}`, marginX, y, { align: 'center', width: pageW });

  addFooter();
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

      const user = await prisma.usuario.findUnique({
        where: { id: req.usuario.id },
        select: { nombre: true, apellido: true }
      });
      const autorNombre = user ? `${user.nombre} ${user.apellido}` : req.usuario.usuario;

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
          ['Código', 'Nombre', 'Categoría', 'Stock', 'Estado'], filas, '#10367d', autorNombre);
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
          ['Código', 'Nombre', 'Categoría', 'Veces prestado', 'Total unidades'], filas, '#10367d', autorNombre);
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
          ['Código', 'Nombre', 'Categoría', 'Veces prestado', 'Total unidades'], filas, '#10367d', autorNombre);
      } else {
        res.status(400).json({ status: 'error', mensaje: 'Tipo de reporte inválido' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', mensaje: 'Error al generar PDF' });
    }
  }
};

module.exports = reportesController;
