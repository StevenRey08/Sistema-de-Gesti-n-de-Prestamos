const { prisma } = require('../db');

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Creando datos de prueba...');

  // ===== 1. UBICACIONES =====
  console.log('Creando ubicaciones...');
  const ubData = [
    { codigo: 'BOD-001', nombre: 'Bodega Principal', tipo: 'BODEGA', descripcion: 'Bodega central del inventario' },
    { codigo: 'AULA-001', nombre: 'Aula Taller 1', tipo: 'AULA', descripcion: 'Aula taller de electrónica' },
    { codigo: 'AULA-002', nombre: 'Aula Taller 2', tipo: 'AULA', descripcion: 'Aula taller de mecánica' },
    { codigo: 'LAB-001', nombre: 'Laboratorio de Cómputo', tipo: 'LABORATORIO', descripcion: 'Laboratorio principal' },
    { codigo: 'ALM-001', nombre: 'Almacén General', tipo: 'ALMACEN', descripcion: 'Almacén de herramientas generales' },
  ];
  const ubicaciones = [];
  for (const u of ubData) {
    const ub = await prisma.ubicacion.upsert({
      where: { codigo: u.codigo },
      update: u,
      create: u,
    });
    ubicaciones.push(ub);
  }
  const [ubBodega, ubAula1, ubAula2, ubLab, ubAlmacen] = ubicaciones;
  console.log(`  ${ubicaciones.length} ubicaciones creadas/verificadas`);

  // ===== 2. CATEGORIAS =====
  console.log('Creando categorías...');
  const catData = [
    { nombre: 'Herramientas Eléctricas', descripcion: 'Taladros, sierras, etc.', ubicacion_id: ubBodega.id },
    { nombre: 'Herramientas Manuales', descripcion: 'Destornilladores, llaves, alicates', ubicacion_id: ubBodega.id },
    { nombre: 'Equipos de Medición', descripcion: 'Multímetros, calibradores', ubicacion_id: ubLab.id },
    { nombre: 'Equipo de Seguridad', descripcion: 'Cascos, guantes, lentes', ubicacion_id: ubAlmacen.id },
    { nombre: 'Consumibles', descripcion: 'Tornillos, cables, soldadura', ubicacion_id: ubAlmacen.id },
  ];
  const categorias = [];
  for (const c of catData) {
    const cat = await prisma.categoriaHerramienta.upsert({
      where: { nombre: c.nombre },
      update: { descripcion: c.descripcion, ubicacion: { connect: { id: c.ubicacion_id } } },
      create: { nombre: c.nombre, descripcion: c.descripcion, ubicacion: { connect: { id: c.ubicacion_id } } },
    });
    categorias.push(cat);
  }
  console.log(`  ${categorias.length} categorías creadas/verificadas`);

  // ===== 3. INVENTARIO =====
  console.log('Creando inventario...');
  const [catHerrElec, catHerrMan, catEquipos, catSeguridad, catConsum] = categorias;
  const items = [
    { codigo: 'INV-001', nombre: 'Taladro Inalámbrico 18V', cat: catHerrElec, total: 10, disp: 6, danada: 1 },
    { codigo: 'INV-002', nombre: 'Sierra Circular 7-1/4"', cat: catHerrElec, total: 5, disp: 3, danada: 0 },
    { codigo: 'INV-003', nombre: 'Soldador de Estaño 60W', cat: catHerrElec, total: 15, disp: 10, danada: 2 },
    { codigo: 'INV-004', nombre: 'Set Destornilladores (20 pzas)', cat: catHerrMan, total: 25, disp: 18, danada: 0 },
    { codigo: 'INV-005', nombre: 'Llave Inglesa Ajustable 12"', cat: catHerrMan, total: 20, disp: 15, danada: 0 },
    { codigo: 'INV-006', nombre: 'Alicate Universal 8"', cat: catHerrMan, total: 30, disp: 22, danada: 3 },
    { codigo: 'INV-007', nombre: 'Multímetro Digital', cat: catEquipos, total: 12, disp: 8, danada: 1 },
    { codigo: 'INV-008', nombre: 'Calibrador Vernier 6"', cat: catEquipos, total: 8, disp: 5, danada: 0 },
    { codigo: 'INV-009', nombre: 'Casco de Seguridad Blanco', cat: catSeguridad, total: 40, disp: 30, danada: 2 },
    { codigo: 'INV-010', nombre: 'Lentes de Seguridad', cat: catSeguridad, total: 50, disp: 40, danada: 0 },
    { codigo: 'INV-011', nombre: 'Guantes de Nitrilo (caja 100)', cat: catSeguridad, total: 15, disp: 10, danada: 0 },
    { codigo: 'INV-012', nombre: 'Cable Eléctrico 14 AWG (rollo)', cat: catConsum, total: 10, disp: 7, danada: 0 },
    { codigo: 'INV-013', nombre: 'Estaño para Soldar 100g', cat: catConsum, total: 20, disp: 14, danada: 0 },
    { codigo: 'INV-014', nombre: 'Tornillos M4x20mm (caja 100)', cat: catConsum, total: 25, disp: 20, danada: 0 },
    { codigo: 'INV-015', nombre: 'Amoladora Angular 4-1/2"', cat: catHerrElec, total: 6, disp: 4, danada: 0 },
  ];
  const invCreated = [];
  for (const item of items) {
    const inv = await prisma.inventario.upsert({
      where: { codigo: item.codigo },
      update: { nombre: item.nombre, cantidad_total: item.total, cantidad_disponible: item.disp, cantidad_danada: item.danada, categoria: { connect: { id: item.cat.id } } },
      create: { codigo: item.codigo, nombre: item.nombre, cantidad_total: item.total, cantidad_disponible: item.disp, cantidad_danada: item.danada, categoria: { connect: { id: item.cat.id } } },
    });
    invCreated.push(inv);
  }
  console.log(`  ${invCreated.length} items de inventario creados`);

  // ===== 4. PERSONAS =====
  console.log('Creando personas...');
  const docentesData = [
    { matricula: '001-1234567-8', nombres: 'Roberto', apellidos: 'Martínez López', tipo: 'PROFESOR' },
    { matricula: '001-2345678-9', nombres: 'Ana', apellidos: 'García Hernández', tipo: 'PROFESOR' },
    { matricula: '001-3456789-0', nombres: 'Carlos', apellidos: 'Ramírez Díaz', tipo: 'PROFESOR' },
    { matricula: '001-4567890-1', nombres: 'María', apellidos: 'Fernández Ruiz', tipo: 'TECNICO' },
    { matricula: '001-5678901-2', nombres: 'Pedro', apellidos: 'Sánchez Torres', tipo: 'TECNICO' },
    { matricula: '001-6789012-3', nombres: 'Laura', apellidos: 'Morales Vargas', tipo: 'ADMINISTRATIVO' },
  ];
  const docCreated = [];
  for (const d of docentesData) {
    const persona = await prisma.persona.upsert({
      where: { matricula: d.matricula },
      update: d,
      create: d,
    });
    docCreated.push(persona);
  }

  const estData = [
    { matricula: '2024-0001', nombres: 'Juan', apellidos: 'Pérez García', tipo: 'ESTUDIANTE', curso: '5to A' },
    { matricula: '2024-0002', nombres: 'María', apellidos: 'López Torres', tipo: 'ESTUDIANTE', curso: '5to B' },
    { matricula: '2024-0003', nombres: 'José', apellidos: 'Martínez Cruz', tipo: 'ESTUDIANTE', curso: '6to A' },
    { matricula: '2024-0004', nombres: 'Carmen', apellidos: 'Hernández Díaz', tipo: 'ESTUDIANTE', curso: '4to A' },
    { matricula: '2024-0005', nombres: 'Luis', apellidos: 'González Ruiz', tipo: 'ESTUDIANTE', curso: '6to B' },
    { matricula: '2024-0006', nombres: 'Sofía', apellidos: 'Ramírez Morales', tipo: 'ESTUDIANTE', curso: '5to C' },
    { matricula: '2024-0007', nombres: 'Diego', apellidos: 'Vargas Fernández', tipo: 'ESTUDIANTE', curso: '4to B' },
    { matricula: '2024-0008', nombres: 'Valentina', apellidos: 'Torres Sánchez', tipo: 'ESTUDIANTE', curso: '6to C' },
    { matricula: '2024-0009', nombres: 'Andrés', apellidos: 'Cruz López', tipo: 'ESTUDIANTE', curso: '5to A' },
    { matricula: '2024-0010', nombres: 'Isabella', apellidos: 'Díaz Martínez', tipo: 'ESTUDIANTE', curso: '4to C' },
    { matricula: '2024-0011', nombres: 'Mateo', apellidos: 'García Pérez', tipo: 'ESTUDIANTE', curso: '6to A' },
    { matricula: '2024-0012', nombres: 'Daniela', apellidos: 'Hernández Vargas', tipo: 'ESTUDIANTE', curso: '5to B' },
  ];
  const estCreated = [];
  for (const e of estData) {
    const persona = await prisma.persona.upsert({
      where: { matricula: e.matricula },
      update: e,
      create: e,
    });
    estCreated.push(persona);
  }
  console.log(`  ${docCreated.length} docentes y ${estCreated.length} estudiantes creados`);

  // ===== 5. USUARIO =====
  console.log('Buscando usuarios existentes...');
  const usuario = await prisma.usuario.findFirst({ where: { activo: true } });
  if (!usuario) {
    console.error('ERROR: No hay usuarios activos.');
    process.exit(1);
  }
  console.log(`  Usuario: ${usuario.nombre} ${usuario.apellido}`);

  // ===== 6. PRÉSTAMOS =====
  console.log('Creando préstamos...');

  const prestamosData = [
    { est: 0, inst: 0, inv: 0, cant: 2, estado: 'ACTIVO', obs: 'Préstamo para práctica de electrónica', devuelto: false },
    { est: 1, inst: 1, inv: 3, cant: 1, estado: 'ACTIVO', obs: 'Set de destornilladores para mantenimiento', devuelto: false },
    { est: 2, inst: 0, inv: 6, cant: 1, estado: 'ACTIVO', obs: 'Multímetro para laboratorio', devuelto: false },
    { est: 3, inst: 2, inv: 8, cant: 5, estado: 'ACTIVO', obs: 'Cascos para práctica de taller', devuelto: false },
    { est: 4, inst: 1, inv: 1, cant: 1, estado: 'ACTIVO', obs: 'Sierra circular para proyecto', devuelto: false },
    { est: 5, inst: 2, inv: 2, cant: 1, estado: 'DEVUELTO', obs: 'Soldador devuelto en buen estado', devuelto: true },
    { est: 6, inst: 3, inv: 4, cant: 2, estado: 'DEVUELTO', obs: 'Llaves inglesas devueltas', devuelto: true },
    { est: 7, inst: 4, inv: 9, cant: 3, estado: 'DEVUELTO', obs: 'Lentes de seguridad devueltos', devuelto: true },
    { est: 8, inst: 0, inv: 10, cant: 1, estado: 'DEVUELTO', obs: 'Guantes de nitrilo devueltos', devuelto: true },
    { est: 9, inst: 1, inv: 12, cant: 2, estado: 'DEVUELTO', obs: 'Estaño para soldadura devuelto', devuelto: true },
    { est: 10, inst: 3, inv: 14, cant: 1, estado: 'PENDIENTE', obs: 'Amoladora pendiente de devolución', devuelto: false },
    { est: 11, inst: 5, inv: 7, cant: 1, estado: 'PENDIENTE', obs: 'Calibrador vernier pendiente', devuelto: false },
  ];

  const prestamosCreated = [];
  for (const p of prestamosData) {
    const fechaPrestamo = randomDate(new Date(2026, 1, 15), new Date(2026, 4, 10));
    const data = {
      persona: { connect: { id: estCreated[p.est].id } },
      instructor: { connect: { id: docCreated[p.inst].id } },
      inventario: { connect: { id: invCreated[p.inv].id } },
      usuario: { connect: { id: usuario.id } },
      cantidad: p.cant,
      estado: p.estado,
      observaciones: p.obs,
      fecha_prestamo: fechaPrestamo,
    };
    if (p.devuelto) {
      data.fecha_devolucion = randomDate(new Date(2026, 4, 18), new Date(2026, 6, 31));
    }
    const prestamo = await prisma.prestamo.create({ data });
    prestamosCreated.push(prestamo);
  }
  console.log(`  ${prestamosCreated.length} préstamos creados (5 activos, 5 devueltos, 2 pendientes)`);

  // ===== 7. MOVIMIENTOS =====
  console.log('Creando movimientos...');
  const movimientosData = [
    { tipo: 'SALIDA', inv: 0, per: estCreated[0], orig: ubBodega, dest: ubAula1, cant: 2, pre: 0 },
    { tipo: 'SALIDA', inv: 3, per: estCreated[1], orig: ubBodega, dest: ubAula2, cant: 1, pre: 1 },
    { tipo: 'SALIDA', inv: 6, per: estCreated[2], orig: ubLab, dest: ubLab, cant: 1, pre: 2 },
    { tipo: 'SALIDA', inv: 8, per: estCreated[3], orig: ubAlmacen, dest: ubAula1, cant: 5, pre: 3 },
    { tipo: 'SALIDA', inv: 1, per: estCreated[4], orig: ubBodega, dest: ubAula2, cant: 1, pre: 4 },
    { tipo: 'SALIDA', inv: 2, per: estCreated[5], orig: ubBodega, dest: ubAula1, cant: 1, pre: 5 },
    { tipo: 'SALIDA', inv: 4, per: estCreated[6], orig: ubBodega, dest: ubAula2, cant: 2, pre: 6 },
    { tipo: 'SALIDA', inv: 9, per: estCreated[7], orig: ubAlmacen, dest: ubLab, cant: 3, pre: 7 },
    { tipo: 'SALIDA', inv: 10, per: estCreated[8], orig: ubAlmacen, dest: ubAula1, cant: 1, pre: 8 },
    { tipo: 'SALIDA', inv: 12, per: estCreated[9], orig: ubAlmacen, dest: ubLab, cant: 2, pre: 9 },
    { tipo: 'SALIDA', inv: 14, per: estCreated[10], orig: ubBodega, dest: ubAula2, cant: 1, pre: 10 },
    { tipo: 'SALIDA', inv: 7, per: estCreated[11], orig: ubLab, dest: ubAula1, cant: 1, pre: 11 },
    { tipo: 'ENTRADA', inv: 2, per: estCreated[5], orig: ubAula1, dest: ubBodega, cant: 1, pre: 5 },
    { tipo: 'ENTRADA', inv: 4, per: estCreated[6], orig: ubAula2, dest: ubBodega, cant: 2, pre: 6 },
    { tipo: 'ENTRADA', inv: 9, per: estCreated[7], orig: ubLab, dest: ubAlmacen, cant: 3, pre: 7 },
    { tipo: 'ENTRADA', inv: 10, per: estCreated[8], orig: ubAula1, dest: ubAlmacen, cant: 1, pre: 8 },
    { tipo: 'ENTRADA', inv: 12, per: estCreated[9], orig: ubLab, dest: ubAlmacen, cant: 2, pre: 9 },
    { tipo: 'TRANSFERENCIA', inv: 0, per: docCreated[0], orig: ubBodega, dest: ubLab, cant: 3 },
    { tipo: 'TRANSFERENCIA', inv: 5, per: docCreated[4], orig: ubBodega, dest: ubAula1, cant: 5 },
  ];

  const movCreated = [];
  for (const m of movimientosData) {
    const fecha = randomDate(new Date(2026, 2, 1), new Date(2026, 4, 17));
    const mov = await prisma.movimiento.create({
      data: {
        tipo: m.tipo,
        inventario: { connect: { id: invCreated[m.inv].id } },
        persona: { connect: { id: m.per.id } },
        usuario: { connect: { id: usuario.id } },
        prestamo: m.pre !== undefined ? { connect: { id: prestamosCreated[m.pre].id } } : undefined,
        cantidad: m.cant,
        fecha: fecha,
        ubicacion_origen: { connect: { id: m.orig.id } },
        ubicacion_destino: { connect: { id: m.dest.id } },
      }
    });
    movCreated.push(mov);
  }
  console.log(`  ${movCreated.length} movimientos creados (todos con origen y destino)`);

  console.log('\n=== RESUMEN ===');
  console.log(`Ubicaciones:   ${ubicaciones.length}`);
  console.log(`Categorías:    ${categorias.length}`);
  console.log(`Inventario:    ${invCreated.length}`);
  console.log(`Docentes:      ${docCreated.length}`);
  console.log(`Estudiantes:   ${estCreated.length}`);
  console.log(`Préstamos:     ${prestamosCreated.length}`);
  console.log(`Movimientos:   ${movCreated.length}`);
  console.log('================\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => process.exit(0));
