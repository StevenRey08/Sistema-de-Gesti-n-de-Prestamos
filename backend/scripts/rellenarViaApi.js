const BASE_URL = 'http://localhost:4000/api';

async function login() {
  console.log('🔐 Iniciando sesión como admin...');
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin' }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Login fallido:', data.mensaje);
    process.exit(1);
  }
  console.log(`✅ Sesión iniciada: ${data.usuario.nombre} ${data.usuario.apellido}`);
  return data.token;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function apiPost(endpoint, body, token) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`  ❌ Error POST ${endpoint}:`, data.mensaje || data.error || JSON.stringify(data));
    throw new Error(data.mensaje || data.error || 'Error en API');
  }
  return data;
}

async function apiGet(endpoint, token) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Error en GET');
  return data;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function fmtDate(d) {
  return d.toISOString().split('T')[0];
}

async function main() {
  const token = await login();

  // ===== 1. UBICACIONES =====
  console.log('\n📦 Creando ubicaciones...');
  const ubiData = [
    { nombre: 'Estante Principal', tipo: 'ESTANTE', descripcion: 'Estante central del taller' },
    { nombre: 'Caja Herramientas A', tipo: 'CAJA', descripcion: 'Caja de herramientas manuales' },
    { nombre: 'Estante Eléctrico', tipo: 'ESTANTE', descripcion: 'Estante para herramientas eléctricas' },
    { nombre: 'Caja Material Eléctrico', tipo: 'CAJA', descripcion: 'Caja para cables y materiales' },
    { nombre: 'Estante Seguridad', tipo: 'ESTANTE', descripcion: 'Estante para equipos de protección' },
  ];
  const ubicaciones = [];
  for (const u of ubiData) {
    const created = await apiPost('/ubicaciones', u, token);
    ubicaciones.push(created);
    console.log(`  ✅ ${created.codigo} - ${created.nombre}`);
  }
  const [ub1, ub2, ub3, ub4, ub5] = ubicaciones;

  // ===== 2. CATEGORÍAS =====
  console.log('\n📂 Creando categorías...');
  const catData = [
    { nombre: 'Herramientas Manuales', descripcion: 'Llaves, martillos, destornilladores, etc.' },
    { nombre: 'Herramientas Eléctricas', descripcion: 'Taladros, sierras, esmeriles, etc.' },
    { nombre: 'Materiales Eléctricos', descripcion: 'Cables, interruptores, fusibles' },
    { nombre: 'Equipo de Seguridad', descripcion: 'Cascos, guantes, lentes protectores' },
    { nombre: 'Instrumentos de Medición', descripcion: 'Flexómetros, calibradores, niveles' },
  ];
  const categorias = [];
  for (const c of catData) {
    const created = await apiPost('/categorias', c, token);
    categorias.push(created);
    console.log(`  ✅ ${created.nombre}`);
  }
  const [cat1, cat2, cat3, cat4, cat5] = categorias;

  // ===== 3. INVENTARIO =====
  console.log('\n🔧 Creando inventario...');
  const invData = [
    { nombre: 'Juego Llaves Allen 6pz', categoria_id: cat1.id, cantidad_total: 18, cantidad_disponible: 18, cantidad_danada: 0 },
    { nombre: 'Llave Adjustable 12"', categoria_id: cat1.id, cantidad_total: 10, cantidad_disponible: 10, cantidad_danada: 0 },
    { nombre: 'Destornillador Plano 6x150mm', categoria_id: cat1.id, cantidad_total: 28, cantidad_disponible: 28, cantidad_danada: 0 },
    { nombre: 'Destornillador Estrella #2', categoria_id: cat1.id, cantidad_total: 25, cantidad_disponible: 25, cantidad_danada: 0 },
    { nombre: 'Martillo Carpintero 500g', categoria_id: cat1.id, cantidad_total: 12, cantidad_disponible: 12, cantidad_danada: 0 },
    { nombre: 'Martillo de Goma', categoria_id: cat1.id, cantidad_total: 6, cantidad_disponible: 6, cantidad_danada: 0 },
    { nombre: 'Pinza Universal 8"', categoria_id: cat1.id, cantidad_total: 14, cantidad_disponible: 14, cantidad_danada: 0 },
    { nombre: 'Taladro Eléctrico 500W', categoria_id: cat2.id, cantidad_total: 8, cantidad_disponible: 8, cantidad_danada: 0 },
    { nombre: 'Taladro Percutor 800W', categoria_id: cat2.id, cantidad_total: 4, cantidad_disponible: 4, cantidad_danada: 0 },
    { nombre: 'Sierra Circular 7-1/4"', categoria_id: cat2.id, cantidad_total: 5, cantidad_disponible: 5, cantidad_danada: 0 },
    { nombre: 'Esmeril Angular 4-1/2"', categoria_id: cat2.id, cantidad_total: 3, cantidad_disponible: 3, cantidad_danada: 0 },
    { nombre: 'Soldadora Inverter 160A', categoria_id: cat2.id, cantidad_total: 2, cantidad_disponible: 2, cantidad_danada: 0 },
    { nombre: 'Caladora 650W', categoria_id: cat2.id, cantidad_total: 3, cantidad_disponible: 3, cantidad_danada: 0 },
    { nombre: 'Cable THW #12 (rollo 100m)', categoria_id: cat3.id, cantidad_total: 15, cantidad_disponible: 15, cantidad_danada: 0 },
    { nombre: 'Interruptor Sencillo', categoria_id: cat3.id, cantidad_total: 50, cantidad_disponible: 50, cantidad_danada: 0 },
    { nombre: 'Fusible 10A (pkg 10)', categoria_id: cat3.id, cantidad_total: 40, cantidad_disponible: 40, cantidad_danada: 0 },
    { nombre: 'Casco de Seguridad', categoria_id: cat4.id, cantidad_total: 20, cantidad_disponible: 20, cantidad_danada: 0 },
    { nombre: 'Guantes de Trabajo (par)', categoria_id: cat4.id, cantidad_total: 25, cantidad_disponible: 25, cantidad_danada: 0 },
    { nombre: 'Lentes de Seguridad', categoria_id: cat4.id, cantidad_total: 30, cantidad_disponible: 30, cantidad_danada: 0 },
    { nombre: 'Flexómetro 5m', categoria_id: cat5.id, cantidad_total: 12, cantidad_disponible: 12, cantidad_danada: 0 },
    { nombre: 'Calibrador Vernier Digital', categoria_id: cat5.id, cantidad_total: 4, cantidad_disponible: 4, cantidad_danada: 0 },
    { nombre: 'Nivel de Burbuja 24"', categoria_id: cat5.id, cantidad_total: 6, cantidad_disponible: 6, cantidad_danada: 0 },
  ];
  const inventario = [];
  for (const item of invData) {
    const created = await apiPost('/inventario', item, token);
    inventario.push(created);
    console.log(`  ✅ ${created.codigo} - ${created.nombre} (Stock: ${created.cantidad_disponible})`);
  }

  // ===== 4. PERSONAS =====
  console.log('\n👥 Creando personas (docentes y estudiantes)...');
  const docentesData = [
    { matricula: '001-1234567-8', nombres: 'Roberto', apellidos: 'Martínez López', tipo: 'PROFESOR' },
    { matricula: '001-2345678-9', nombres: 'Ana', apellidos: 'García Hernández', tipo: 'PROFESOR' },
    { matricula: '001-3456789-0', nombres: 'Carlos', apellidos: 'Ramírez Díaz', tipo: 'PROFESOR' },
    { matricula: '001-4567890-1', nombres: 'María', apellidos: 'Fernández Ruiz', tipo: 'TECNICO' },
    { matricula: '001-5678901-2', nombres: 'Pedro', apellidos: 'Sánchez Torres', tipo: 'TECNICO' },
    { matricula: '001-6789012-3', nombres: 'Laura', apellidos: 'Morales Vargas', tipo: 'ADMINISTRATIVO' },
  ];
  const docentes = [];
  for (const d of docentesData) {
    const created = await apiPost('/personas', d, token);
    docentes.push(created);
    console.log(`  ✅ ${created.matricula} - ${created.nombres} ${created.apellidos} (${created.tipo})`);
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
  const estudiantes = [];
  for (const e of estData) {
    const created = await apiPost('/personas', e, token);
    estudiantes.push(created);
    console.log(`  ✅ ${created.matricula} - ${created.nombres} ${created.apellidos} (${created.curso})`);
  }

  // ===== 5. PRÉSTAMOS =====
  console.log('\n📋 Creando préstamos...');
  const hoy = new Date(2026, 4, 17);

  const prestamosConfig = [
    // ACTIVOS (sin fecha devolución)
    { est: 0, inst: 0, inv: 7, cant: 2, estado: 'ACTIVO', obs: 'Taladro para práctica de electrónica', devuelto: false },
    { est: 1, inst: 1, inv: 3, cant: 1, estado: 'ACTIVO', obs: 'Destornilladores para mantenimiento', devuelto: false },
    { est: 2, inst: 0, inv: 19, cant: 1, estado: 'ACTIVO', obs: 'Flexómetro para laboratorio', devuelto: false },
    { est: 3, inst: 2, inv: 16, cant: 5, estado: 'ACTIVO', obs: 'Cascos para práctica de taller', devuelto: false },
    { est: 4, inst: 1, inv: 9, cant: 1, estado: 'ACTIVO', obs: 'Sierra circular para proyecto', devuelto: false },
    // DEVUELTOS (con fecha devolución posterior a hoy)
    { est: 5, inst: 2, inv: 11, cant: 1, estado: 'DEVUELTO', obs: 'Soldadora devuelta en buen estado', devuelto: true },
    { est: 6, inst: 3, inv: 4, cant: 2, estado: 'DEVUELTO', obs: 'Martillos devueltos', devuelto: true },
    { est: 7, inst: 4, inv: 18, cant: 3, estado: 'DEVUELTO', obs: 'Lentes de seguridad devueltos', devuelto: true },
    { est: 8, inst: 0, inv: 17, cant: 1, estado: 'DEVUELTO', obs: 'Guantes devueltos', devuelto: true },
    { est: 9, inst: 1, inv: 13, cant: 2, estado: 'DEVUELTO', obs: 'Cable eléctrico devuelto', devuelto: true },
    // PENDIENTES
    { est: 10, inst: 3, inv: 10, cant: 1, estado: 'PENDIENTE', obs: 'Esmeril pendiente de devolución', devuelto: false },
    { est: 11, inst: 5, inv: 20, cant: 1, estado: 'PENDIENTE', obs: 'Calibrador vernier pendiente', devuelto: false },
  ];

  const prestamosCreated = [];
  for (const p of prestamosConfig) {
    const fechaPrestamo = randomDate(new Date(2026, 1, 15), new Date(2026, 4, 10));
    const body = {
      inventario_id: inventario[p.inv].id,
      persona_id: estudiantes[p.est].id,
      instructor_id: docentes[p.inst].id,
      cantidad: p.cant,
      fecha_devolucion: p.devuelto
        ? fmtDate(randomDate(new Date(2026, 4, 18), new Date(2026, 6, 31)))
        : fmtDate(new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)),
      observaciones: p.obs,
    };
    const result = await apiPost('/prestamos', body, token);
    prestamosCreated.push(result.data || result);
    console.log(`  ✅ ${p.estado}: ${estudiantes[p.est].nombres} -> ${inventario[p.inv].nombre} (x${p.cant}) [Instructor: ${docentes[p.inst].nombres}]`);
  }

  // ===== 6. MOVIMIENTOS (con origen y destino) =====
  console.log('\n🔄 Creando movimientos...');
  const movsConfig = [
    { tipo: 'SALIDA', inv: 7, est: 0, cant: 2, pre: 0, obs: 'Taladros prestados' },
    { tipo: 'SALIDA', inv: 3, est: 1, cant: 1, pre: 1, obs: 'Destornilladores prestados' },
    { tipo: 'SALIDA', inv: 19, est: 2, cant: 1, pre: 2, obs: 'Flexómetro prestado' },
    { tipo: 'SALIDA', inv: 16, est: 3, cant: 5, pre: 3, obs: 'Cascos prestados' },
    { tipo: 'SALIDA', inv: 9, est: 4, cant: 1, pre: 4, obs: 'Sierra prestada' },
    { tipo: 'SALIDA', inv: 11, est: 5, cant: 1, pre: 5, obs: 'Soldadora prestada' },
    { tipo: 'SALIDA', inv: 4, est: 6, cant: 2, pre: 6, obs: 'Martillos prestados' },
    { tipo: 'SALIDA', inv: 18, est: 7, cant: 3, pre: 7, obs: 'Lentes prestados' },
    { tipo: 'SALIDA', inv: 17, est: 8, cant: 1, pre: 8, obs: 'Guantes prestados' },
    { tipo: 'SALIDA', inv: 13, est: 9, cant: 2, pre: 9, obs: 'Cable prestado' },
    { tipo: 'SALIDA', inv: 10, est: 10, cant: 1, pre: 10, obs: 'Esmeril prestado' },
    { tipo: 'SALIDA', inv: 20, est: 11, cant: 1, pre: 11, obs: 'Calibrador prestado' },
    // Devoluciones (ENTRADA)
    { tipo: 'ENTRADA', inv: 11, est: 5, cant: 1, pre: 5, obs: 'Soldadora devuelta' },
    { tipo: 'ENTRADA', inv: 4, est: 6, cant: 2, pre: 6, obs: 'Martillos devueltos' },
    { tipo: 'ENTRADA', inv: 18, est: 7, cant: 3, pre: 7, obs: 'Lentes devueltos' },
    { tipo: 'ENTRADA', inv: 17, est: 8, cant: 1, pre: 8, obs: 'Guantes devueltos' },
    { tipo: 'ENTRADA', inv: 13, est: 9, cant: 2, pre: 9, obs: 'Cable devuelto' },
  ];

  const movsCreated = [];
  for (const m of movsConfig) {
    const fecha = randomDate(new Date(2026, 2, 1), hoy);
    const body = {
      inventario_id: inventario[m.inv].id,
      tipo: m.tipo,
      cantidad: m.cant,
      persona_id: estudiantes[m.est].id,
      ubicacion_origen_id: ub1.id,
      ubicacion_destino_id: ub2.id,
      observaciones: m.obs,
    };
    try {
      const created = await apiPost('/movimientos', body, token);
      movsCreated.push(created);
      console.log(`  ✅ ${m.tipo}: ${inventario[m.inv].nombre} x${m.cant} (${m.obs})`);
    } catch (e) {
      // Some movements may fail due to stock constraints, that's ok
      console.log(`  ⚠️ Saltado: ${m.obs} (stock insuficiente)`);
    }
  }

  // ===== RESUMEN =====
  console.log('\n═══════════════════════════════════════');
  console.log('📊 RESUMEN DE DATOS CREADOS');
  console.log('═══════════════════════════════════════');
  console.log(`Ubicaciones:    ${ubicaciones.length}`);
  console.log(`Categorías:     ${categorias.length}`);
  console.log(`Inventario:     ${inventario.length} items`);
  console.log(`Docentes:       ${docentes.length}`);
  console.log(`Estudiantes:    ${estudiantes.length}`);
  console.log(`Préstamos:      ${prestamosCreated.length}`);
  console.log(`Movimientos:    ${movsCreated.length}`);
  console.log('═══════════════════════════════════════');
  console.log('✅ ¡Datos creados exitosamente vía API!');
}

main().catch(e => { console.error(e); process.exit(1); });
