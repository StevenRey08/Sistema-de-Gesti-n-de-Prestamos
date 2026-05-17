const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Sembrando datos...\n');

    // ────────────────────────────────────
    // 1. ROLES (3)
    // ────────────────────────────────────
    const rolesData = [
        { nombre_rol: 'ADMINISTRADOR', descripcion: 'Control total del sistema', protegido: true },
        { nombre_rol: 'OPERADOR',      descripcion: 'Gestión de inventario y préstamos' },
        { nombre_rol: 'AUDITOR',       descripcion: 'Solo lectura y reportes' },
    ];
    for (const r of rolesData) {
        await prisma.role.upsert({
            where: { nombre_rol: r.nombre_rol },
            update: {},
            create: r,
        });
    }
    console.log('✅ Roles creados (3)');

    // ────────────────────────────────────
    // 2. MÓDULOS (10)
    // ────────────────────────────────────
    const modulosData = [
        { nombre: 'DASHBOARD',   descripcion: 'Panel de control y estadísticas' },
        { nombre: 'USUARIOS',    descripcion: 'Gestión de usuarios y accesos' },
        { nombre: 'INVENTARIO',  descripcion: 'Control de herramientas' },
        { nombre: 'PRESTAMOS',   descripcion: 'Salidas y entradas de herramientas' },
        { nombre: 'MOVIMIENTOS', descripcion: 'Historial de traslados y ajustes' },
        { nombre: 'PERSONAS',    descripcion: 'Gestión de beneficiarios' },
        { nombre: 'UBICACIONES', descripcion: 'Gestión de estantes y cajas' },
        { nombre: 'CATEGORIAS',  descripcion: 'Clasificación de herramientas' },
        { nombre: 'ROLES',       descripcion: 'Gestión de roles del sistema' },
        { nombre: 'PERMISOS',    descripcion: 'Asignación de permisos por rol' },
    ];
    for (const m of modulosData) {
        await prisma.modulo.upsert({
            where: { nombre: m.nombre },
            update: {},
            create: m,
        });
    }
    console.log('✅ Módulos creados (10)');

    // ────────────────────────────────────
    // 3. USUARIOS (5)
    // ────────────────────────────────────
    const adminRole = await prisma.role.findUnique({ where: { nombre_rol: 'ADMINISTRADOR' } });
    const operadorRole = await prisma.role.findUnique({ where: { nombre_rol: 'OPERADOR' } });
    const auditorRole = await prisma.role.findUnique({ where: { nombre_rol: 'AUDITOR' } });

    const usuariosData = [
        { td: 'CEDULA', nd: '000-0000000-0', nombre: 'Administrador', apellido: 'Del Sistema', usuario: 'admin', pass: 'admin', rol: adminRole.id },
        { td: 'CEDULA', nd: '000-0000000-1', nombre: 'Operador', apellido: 'De Taller', usuario: 'operador', pass: 'operador123', rol: operadorRole.id },
        { td: 'CEDULA', nd: '000-0000000-2', nombre: 'Auditor', apellido: 'General', usuario: 'auditor', pass: 'auditor123', rol: auditorRole.id },
        { td: 'CEDULA', nd: '000-0000000-3', nombre: 'Carlos', apellido: 'Mejia', usuario: 'cmejia', pass: 'carlos123', rol: operadorRole.id },
        { td: 'CEDULA', nd: '000-0000000-4', nombre: 'Rosa', apellido: 'Santana', usuario: 'rsantana', pass: 'rosa123', rol: operadorRole.id },
    ];
    for (const u of usuariosData) {
        const hashed = await bcrypt.hash(u.pass, 10);
        await prisma.usuario.upsert({
            where: { usuario: u.usuario },
            update: { contrasena: hashed },
            create: {
                tipo_documento: u.td,
                numero_documento: u.nd,
                nombre: u.nombre,
                apellido: u.apellido,
                usuario: u.usuario,
                contrasena: hashed,
                rol_id: u.rol,
                activo: true,
            },
        });
    }
    console.log('✅ Usuarios creados (5)');

    // ────────────────────────────────────
    // 4. PERMISOS
    // ────────────────────────────────────
    const todosModulos = await prisma.modulo.findMany();
    for (const m of todosModulos) {
        await prisma.permiso.upsert({
            where: { rol_id_modulo_id: { rol_id: adminRole.id, modulo_id: m.id } },
            update: { leer: true, ingresar: true, actualizar: true, eliminar: true },
            create: { rol_id: adminRole.id, modulo_id: m.id, leer: true, ingresar: true, actualizar: true, eliminar: true },
        });
    }
    for (const m of todosModulos) {
        await prisma.permiso.upsert({
            where: { rol_id_modulo_id: { rol_id: auditorRole.id, modulo_id: m.id } },
            update: { leer: true, ingresar: false, actualizar: false, eliminar: false },
            create: { rol_id: auditorRole.id, modulo_id: m.id, leer: true, ingresar: false, actualizar: false, eliminar: false },
        });
    }
    const restringidos = ['USUARIOS', 'ROLES', 'PERMISOS'];
    for (const m of todosModulos) {
        const restr = restringidos.includes(m.nombre);
        const perm = restr
            ? { leer: false, ingresar: false, actualizar: false, eliminar: false }
            : { leer: true, ingresar: true, actualizar: true, eliminar: false };
        await prisma.permiso.upsert({
            where: { rol_id_modulo_id: { rol_id: operadorRole.id, modulo_id: m.id } },
            update: perm,
            create: { rol_id: operadorRole.id, modulo_id: m.id, ...perm },
        });
    }
    console.log('✅ Permisos asignados');

    // ────────────────────────────────────
    // 5. UBICACIONES (8)
    // ────────────────────────────────────
    const ubiRaiz = [
        { codigo: 'TALL-01', nombre: 'Taller Principal',       tipo: 'TALLER',  descripcion: 'Taller de mecánica general' },
        { codigo: 'TALL-02', nombre: 'Taller Electricidad',     tipo: 'TALLER',  descripcion: 'Taller de electricidad' },
        { codigo: 'ALM-A',   nombre: 'Almacén A',              tipo: 'ALMACEN', descripcion: 'Herramientas manuales' },
        { codigo: 'ALM-B',   nombre: 'Almacén B',              tipo: 'ALMACEN', descripcion: 'Materiales eléctricos' },
        { codigo: 'ALM-C',   nombre: 'Almacén C (Seguridad)',  tipo: 'ALMACEN', descripcion: 'EPP y seguridad' },
    ];
    const ubiIds = {};
    for (const u of ubiRaiz) {
        const created = await prisma.ubicacion.upsert({
            where: { codigo: u.codigo },
            update: {},
            create: u,
        });
        ubiIds[u.codigo] = created.id;
    }
    const subUbi = [
        { codigo: 'EST-01', nombre: 'Estante Llaves',       tipo: 'ESTANTE', descripcion: 'Llaves y destornilladores', padre: 'ALM-A' },
        { codigo: 'EST-02', nombre: 'Estante Martillos',    tipo: 'ESTANTE', descripcion: 'Martillos y cortadores', padre: 'ALM-A' },
        { codigo: 'CAJ-01', nombre: 'Caja Eléctrica #1',    tipo: 'CAJA',    descripcion: 'Cables y fusibles', padre: 'ALM-B' },
    ];
    for (const u of subUbi) {
        await prisma.ubicacion.upsert({
            where: { codigo: u.codigo },
            update: {},
            create: {
                codigo: u.codigo,
                nombre: u.nombre,
                tipo: u.tipo,
                descripcion: u.descripcion,
                ubicacion_padre_id: ubiIds[u.padre],
            },
        });
    }
    // Recargar ubiIds
    const todasUbi = await prisma.ubicacion.findMany();
    ubiIds['TALL-01'] = todasUbi.find(u => u.codigo === 'TALL-01').id;
    ubiIds['TALL-02'] = todasUbi.find(u => u.codigo === 'TALL-02').id;
    ubiIds['ALM-A']   = todasUbi.find(u => u.codigo === 'ALM-A').id;
    ubiIds['ALM-B']   = todasUbi.find(u => u.codigo === 'ALM-B').id;
    ubiIds['ALM-C']   = todasUbi.find(u => u.codigo === 'ALM-C').id;
    for (const u of subUbi) ubiIds[u.codigo] = todasUbi.find(ub => ub.codigo === u.codigo).id;
    console.log('✅ Ubicaciones creadas (8)');

    // ────────────────────────────────────
    // 6. CATEGORÍAS (5)
    // ────────────────────────────────────
    const catData = [
        { nombre: 'MANUAL',       descripcion: 'Herramientas manuales' },
        { nombre: 'ELECTRICA',    descripcion: 'Herramientas eléctricas' },
        { nombre: 'MATERIAL_ELEC',descripcion: 'Materiales eléctricos' },
        { nombre: 'SEGURIDAD',    descripcion: 'Equipos de protección' },
        { nombre: 'MEDICION',     descripcion: 'Instrumentos de medición' },
    ];
    const catIds = {};
    for (const c of catData) {
        const created = await prisma.categoriaHerramienta.upsert({
            where: { nombre: c.nombre },
            update: {},
            create: c,
        });
        catIds[c.nombre] = created.id;
    }
    console.log('✅ Categorías creadas (5)');

    // ────────────────────────────────────
    // 7. PERSONAS (15)
    // ────────────────────────────────────
    const personasData = [
        { nd: '2024-001', nombres: 'Juan',     apellidos: 'Perez',      tipo: 'ESTUDIANTE', tel: '809-111-1111', email: 'juan.perez@email.com' },
        { nd: '2024-002', nombres: 'Maria',    apellidos: 'Garcia',     tipo: 'ESTUDIANTE', tel: '809-111-1112', email: 'maria.garcia@email.com' },
        { nd: '2024-003', nombres: 'Carlos',   apellidos: 'Rodriguez',  tipo: 'ESTUDIANTE', tel: '809-111-1113', email: 'carlos.rodriguez@email.com' },
        { nd: '2024-004', nombres: 'Ana',      apellidos: 'Martinez',   tipo: 'ESTUDIANTE', tel: '809-111-1114', email: 'ana.martinez@email.com' },
        { nd: '2024-005', nombres: 'Luis',     apellidos: 'Fernandez',  tipo: 'ESTUDIANTE', tel: '809-111-1115', email: 'luis.fernandez@email.com' },
        { nd: '2024-006', nombres: 'Sofia',    apellidos: 'Ramirez',    tipo: 'ESTUDIANTE', tel: '809-111-1116', email: 'sofia.ramirez@email.com' },
        { nd: '2024-007', nombres: 'Pedro',    apellidos: 'Diaz',       tipo: 'ESTUDIANTE', tel: '809-111-1117', email: 'pedro.diaz@email.com' },
        { nd: '2024-008', nombres: 'Laura',    apellidos: 'Torres',     tipo: 'ESTUDIANTE', tel: '809-111-1118', email: 'laura.torres@email.com' },
        { nd: '2024-009', nombres: 'Miguel',   apellidos: 'Castillo',   tipo: 'ESTUDIANTE', tel: '809-111-1119', email: 'miguel.castillo@email.com' },
        { nd: '2024-010', nombres: 'Carmen',   apellidos: 'Ortiz',      tipo: 'ESTUDIANTE', tel: '809-111-1120', email: 'carmen.ortiz@email.com' },
        { nd: 'PROF-001', nombres: 'Roberto',  apellidos: 'Martinez',   tipo: 'PROFESOR',   tel: '809-222-1111', email: 'roberto.martinez@email.com' },
        { nd: 'PROF-002', nombres: 'Ana',      apellidos: 'Lopez',      tipo: 'PROFESOR',   tel: '809-222-1112', email: 'ana.lopez@email.com' },
        { nd: 'PROF-003', nombres: 'Jose',     apellidos: 'Contreras',  tipo: 'PROFESOR',   tel: '809-222-1113', email: 'jose.contreras@email.com' },
        { nd: 'ADM-001',  nombres: 'Personal', apellidos: 'Admin',      tipo: 'ADMIN',      tel: '809-333-1111', email: 'personal.admin@email.com' },
        { nd: 'EXT-001',  nombres: 'Taller',   apellidos: 'Externo',    tipo: 'EXTERNO',    tel: '809-444-1111', email: 'externo@email.com' },
    ];
    const personaIds = {};
    for (const p of personasData) {
        const created = await prisma.persona.upsert({
            where: { matricula: p.nd },
            update: {},
            create: {
                matricula: p.nd,
                nombres: p.nombres,
                apellidos: p.apellidos,
                tipo: p.tipo,
                telefono: p.tel,
            },
        });
        personaIds[p.nd] = created.id;
    }
    console.log('✅ Personas creadas (15)');

    // ────────────────────────────────────
    // 8. INVENTARIO (40 items)
    // ────────────────────────────────────
    const invData = [
        // MANUAL
        { c: 'LLV-001', n: 'Juego Llaves Allen 6pz',          cat: 'MANUAL',       cant: 18, est: 'Nuevo',  ubi: 'EST-01' },
        { c: 'LLV-002', n: 'Llave Adjustable 12"',             cat: 'MANUAL',       cant: 10, est: 'Usado',  ubi: 'EST-01' },
        { c: 'DST-001', n: 'Destornillador Plano 6x150mm',    cat: 'MANUAL',       cant: 28, est: 'Nuevo',  ubi: 'EST-01' },
        { c: 'DST-002', n: 'Destornillador Estrella #2',      cat: 'MANUAL',       cant: 25, est: 'Nuevo',  ubi: 'EST-01' },
        { c: 'MLL-001', n: 'Martillo Carpintero 500g',        cat: 'MANUAL',       cant: 12, est: 'Usado',  ubi: 'EST-02' },
        { c: 'MLL-002', n: 'Martillo de Goma',                 cat: 'MANUAL',       cant: 6,  est: 'Nuevo',  ubi: 'EST-02' },
        { c: 'CRT-001', n: 'Cortador Industrial',              cat: 'MANUAL',       cant: 8,  est: 'Dañado', ubi: 'EST-02' },
        { c: 'PIN-001', n: 'Pinza Universal 8"',               cat: 'MANUAL',       cant: 14, est: 'Nuevo',  ubi: 'EST-01' },
        { c: 'LIM-001', n: 'Lima Plana 12"',                   cat: 'MANUAL',       cant: 1,  est: 'Usado',  ubi: 'EST-02' },
        { c: 'CEP-001', n: 'Cepillo Carpintero',               cat: 'MANUAL',       cant: 4,  est: 'Usado',  ubi: 'EST-02' },
        { c: 'SRR-001', n: 'Sargento Carpintero 24"',          cat: 'MANUAL',       cant: 1,  est: 'Nuevo',  ubi: 'TALL-01' },
        // ELECTRICA
        { c: 'TLD-001', n: 'Taladro Eléctrico 500W',           cat: 'ELECTRICA',    cant: 8,  est: 'Nuevo',  ubi: 'TALL-01' },
        { c: 'TLD-002', n: 'Taladro Percutor 800W',            cat: 'ELECTRICA',    cant: 4,  est: 'Usado',  ubi: 'TALL-01' },
        { c: 'SRA-001', n: 'Sierra Circular 7 1/4"',           cat: 'ELECTRICA',    cant: 5,  est: 'Nuevo',  ubi: 'TALL-01' },
        { c: 'ESM-001', n: 'Esmeril Angular 4 1/2"',           cat: 'ELECTRICA',    cant: 2,  est: 'Usado',  ubi: 'TALL-02' },
        { c: 'PUL-001', n: 'Pulidora 6"',                     cat: 'ELECTRICA',    cant: 1,  est: 'Dañado', ubi: 'TALL-02' },
        { c: 'CLV-001', n: 'Caladora 650W',                    cat: 'ELECTRICA',    cant: 3,  est: 'Nuevo',  ubi: 'TALL-02' },
        { c: 'ROT-001', n: 'Rotomartillo 1500W',               cat: 'ELECTRICA',    cant: 2,  est: 'Nuevo',  ubi: 'TALL-01' },
        { c: 'COM-001', n: 'Compresor Aire 25L',               cat: 'ELECTRICA',    cant: 1,  est: 'Usado',  ubi: 'TALL-02' },
        { c: 'SOL-001', n: 'Soldadora Inverter 160A',          cat: 'ELECTRICA',    cant: 2,  est: 'Nuevo',  ubi: 'TALL-02' },
        // MATERIAL ELECTRICO
        { c: 'CBL-001', n: 'Cable THW #12 (rollo 100m)',      cat: 'MATERIAL_ELEC',cant: 40, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'CBL-002', n: 'Cable THW #10 (rollo 100m)',      cat: 'MATERIAL_ELEC',cant: 25, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'CBL-003', n: 'Cable THHN #14 (rollo 100m)',     cat: 'MATERIAL_ELEC',cant: 30, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'INT-001', n: 'Interruptor Sencillo',             cat: 'MATERIAL_ELEC',cant: 95, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'INT-002', n: 'Interruptor Doble',                cat: 'MATERIAL_ELEC',cant: 60, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'FUS-001', n: 'Fusible 10A (pkg 10)',             cat: 'MATERIAL_ELEC',cant: 85, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'ENF-001', n: 'Enchufe Polarizado',               cat: 'MATERIAL_ELEC',cant: 50, est: 'Nuevo',  ubi: 'CAJ-01' },
        { c: 'TOM-001', n: 'Toma Corriente Doble',             cat: 'MATERIAL_ELEC',cant: 40, est: 'Nuevo',  ubi: 'CAJ-01' },
        // SEGURIDAD
        { c: 'CAS-001', n: 'Casco de Seguridad',               cat: 'SEGURIDAD',    cant: 20, est: 'Nuevo',  ubi: 'ALM-C' },
        { c: 'GNT-001', n: 'Guantes de Trabajo (par)',         cat: 'SEGURIDAD',    cant: 2,  est: 'Usado',  ubi: 'ALM-C' },
        { c: 'GNT-002', n: 'Guantes Dieléctricos (par)',       cat: 'SEGURIDAD',    cant: 1,  est: 'Nuevo',  ubi: 'ALM-C' },
        { c: 'LNT-001', n: 'Lentes de Seguridad',              cat: 'SEGURIDAD',    cant: 45, est: 'Nuevo',  ubi: 'ALM-C' },
        { c: 'ARN-001', n: 'Arnés de Seguridad',               cat: 'SEGURIDAD',    cant: 1,  est: 'Nuevo',  ubi: 'ALM-C' },
        // MEDICION
        { c: 'FLEX-001', n: 'Flexómetro 5m',                   cat: 'MEDICION',     cant: 12, est: 'Nuevo',  ubi: 'EST-01' },
        { c: 'FLEX-002', n: 'Flexómetro 8m',                   cat: 'MEDICION',     cant: 1,  est: 'Usado',  ubi: 'TALL-01' },
        { c: 'CAL-001', n: 'Calibrador Vernier Digital',       cat: 'MEDICION',     cant: 1,  est: 'Usado',  ubi: 'TALL-01' },
        { c: 'MIC-001', n: 'Micrómetro Exterior 0-25mm',       cat: 'MEDICION',     cant: 1,  est: 'Nuevo',  ubi: 'TALL-01' },
        { c: 'NVL-001', n: 'Nivel de Burbuja 24"',             cat: 'MEDICION',     cant: 5,  est: 'Usado',  ubi: 'EST-01' },
        { c: 'GON-001', n: 'Goniómetro Universal',             cat: 'MEDICION',     cant: 2,  est: 'Nuevo',  ubi: 'TALL-01' },
    ];
    const invIds = {};
    for (const item of invData) {
        const created = await prisma.inventario.upsert({
            where: { codigo: item.c },
            update: {},
            create: {
                codigo: item.c,
                nombre: item.n,
                categoria_id: catIds[item.cat],
                cantidad_total: item.cant,
                cantidad_disponible: item.cant,
                en_uso: 0,
            },
        });
        invIds[item.c] = created.id;
    }
    console.log('✅ Inventario creado (40 items)');

    // ────────────────────────────────────
    // 9. PRÉSTAMOS (10)
    // ────────────────────────────────────
    const operador = await prisma.usuario.findUnique({ where: { usuario: 'operador' } });
    const cmejia = await prisma.usuario.findUnique({ where: { usuario: 'cmejia' } });
    const rsantana = await prisma.usuario.findUnique({ where: { usuario: 'rsantana' } });
    const admin = await prisma.usuario.findUnique({ where: { usuario: 'admin' } });

    const juan = personaIds['2024-001'];
    const maria = personaIds['2024-002'];
    const carlos = personaIds['2024-003'];
    const ana = personaIds['2024-004'];
    const luis = personaIds['2024-005'];
    const sofia = personaIds['2024-006'];
    const pedro = personaIds['2024-007'];
    const roberto = personaIds['PROF-001'];
    const anap = personaIds['PROF-002'];

    const p1 = await prisma.prestamo.create({ data: { inventario_id: invIds['TLD-001'], persona_id: juan, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-04-10'), fecha_devolucion: new Date('2025-04-12'), estado: 'DEVUELTO', observaciones: 'Taladro devuelto en buen estado' } });
    const p2 = await prisma.prestamo.create({ data: { inventario_id: invIds['LLV-001'], persona_id: maria, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-04-15'), estado: 'ACTIVO', observaciones: 'Llaves para práctica de taller' } });
    const p3 = await prisma.prestamo.create({ data: { inventario_id: invIds['SRA-001'], persona_id: carlos, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-04-20'), estado: 'ACTIVO', observaciones: 'Sierra para proyecto final' } });
    const p4 = await prisma.prestamo.create({ data: { inventario_id: invIds['DST-001'], persona_id: ana, usuario_id: cmejia.id, cantidad: 3, fecha_prestamo: new Date('2025-05-02'), fecha_devolucion: new Date('2025-05-05'), estado: 'DEVUELTO', observaciones: 'Destornilladores para taller de electrónica' } });
    const p5 = await prisma.prestamo.create({ data: { inventario_id: invIds['CAS-001'], persona_id: luis, usuario_id: rsantana.id, cantidad: 2, fecha_prestamo: new Date('2025-05-05'), estado: 'ACTIVO', observaciones: 'Cascos para visita a obra' } });
    const p6 = await prisma.prestamo.create({ data: { inventario_id: invIds['FLEX-001'], persona_id: sofia, usuario_id: cmejia.id, cantidad: 1, fecha_prestamo: new Date('2025-05-08'), estado: 'PENDIENTE', observaciones: 'Flexómetro prestado para mediciones' } });
    const p7 = await prisma.prestamo.create({ data: { inventario_id: invIds['MLL-001'], persona_id: pedro, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-05-10'), estado: 'ACTIVO', observaciones: 'Martillo para trabajo de carpintería' } });
    const p8 = await prisma.prestamo.create({ data: { inventario_id: invIds['TLD-002'], persona_id: roberto, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-03-01'), fecha_devolucion: new Date('2025-03-05'), estado: 'DEVUELTO', observaciones: 'Taladro percutor devuelto' } });
    const p9 = await prisma.prestamo.create({ data: { inventario_id: invIds['ESM-001'], persona_id: anap, usuario_id: rsantana.id, cantidad: 1, fecha_prestamo: new Date('2025-03-15'), fecha_devolucion: new Date('2025-03-16'), estado: 'DEVUELTO', observaciones: 'Esmeril para corte de metales' } });
    const p10 = await prisma.prestamo.create({ data: { inventario_id: invIds['GNT-001'], persona_id: juan, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-05-01'), estado: 'VENCIDO', observaciones: 'Guantes no devueltos aún' } });

    // Prestamos adicionales (para que algunos items tengan multiples prestamos)
    const p11 = await prisma.prestamo.create({ data: { inventario_id: invIds['TLD-001'], persona_id: ana, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-02-10'), fecha_devolucion: new Date('2025-02-12'), estado: 'DEVUELTO', observaciones: 'Taladro prestado para proyecto de electrónica' } });
    const p12 = await prisma.prestamo.create({ data: { inventario_id: invIds['TLD-001'], persona_id: roberto, usuario_id: cmejia.id, cantidad: 1, fecha_prestamo: new Date('2025-01-20'), fecha_devolucion: new Date('2025-01-22'), estado: 'DEVUELTO', observaciones: 'Taladro usado en taller de mantenimiento' } });
    const p13 = await prisma.prestamo.create({ data: { inventario_id: invIds['DST-001'], persona_id: carlos, usuario_id: rsantana.id, cantidad: 2, fecha_prestamo: new Date('2025-04-01'), fecha_devolucion: new Date('2025-04-03'), estado: 'DEVUELTO', observaciones: 'Destornilladores para feria tecnica' } });
    const p14 = await prisma.prestamo.create({ data: { inventario_id: invIds['DST-001'], persona_id: luis, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-03-10'), fecha_devolucion: new Date('2025-03-11'), estado: 'DEVUELTO', observaciones: 'Destornillador para reparacion' } });
    const p15 = await prisma.prestamo.create({ data: { inventario_id: invIds['DST-002'], persona_id: juan, usuario_id: operador.id, cantidad: 2, fecha_prestamo: new Date('2025-05-01'), estado: 'ACTIVO', observaciones: 'Destornilladores estrella para taller' } });
    const p16 = await prisma.prestamo.create({ data: { inventario_id: invIds['DST-002'], persona_id: maria, usuario_id: cmejia.id, cantidad: 1, fecha_prestamo: new Date('2025-04-20'), fecha_devolucion: new Date('2025-04-22'), estado: 'DEVUELTO', observaciones: 'Destornillador estrella devuelto' } });
    const p17 = await prisma.prestamo.create({ data: { inventario_id: invIds['LLV-001'], persona_id: sofia, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-05-12'), estado: 'ACTIVO', observaciones: 'Llaves Allen para practica' } });
    const p18 = await prisma.prestamo.create({ data: { inventario_id: invIds['MLL-001'], persona_id: anap, usuario_id: rsantana.id, cantidad: 1, fecha_prestamo: new Date('2025-04-25'), fecha_devolucion: new Date('2025-04-26'), estado: 'DEVUELTO', observaciones: 'Martillo para exposicion' } });
    const p19 = await prisma.prestamo.create({ data: { inventario_id: invIds['CAS-001'], persona_id: pedro, usuario_id: operador.id, cantidad: 1, fecha_prestamo: new Date('2025-05-08'), estado: 'ACTIVO', observaciones: 'Casco para obra externa' } });
    const p20 = await prisma.prestamo.create({ data: { inventario_id: invIds['LNT-001'], persona_id: luis, usuario_id: cmejia.id, cantidad: 2, fecha_prestamo: new Date('2025-05-10'), estado: 'PENDIENTE', observaciones: 'Lentes para grupo de trabajo' } });

    const prestamos = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20];
    console.log('✅ Préstamos creados (20)');

    // ────────────────────────────────────
    // 10. MOVIMIENTOS (30)
    // ────────────────────────────────────
    await prisma.movimiento.createMany({
        data: [
            // Entradas iniciales (carga de inventario)
            { inventario_id: invIds['LLV-001'], usuario_id: admin.id, cantidad: 18, tipo: 'ENTRADA', observaciones: 'Carga inicial de inventario', fecha: new Date('2025-01-15') },
            { inventario_id: invIds['DST-001'], usuario_id: admin.id, cantidad: 28, tipo: 'ENTRADA', observaciones: 'Carga inicial de inventario', fecha: new Date('2025-01-15') },
            { inventario_id: invIds['CBL-001'], usuario_id: admin.id, cantidad: 50, tipo: 'ENTRADA', observaciones: 'Carga inicial de inventario', fecha: new Date('2025-01-15') },
            { inventario_id: invIds['SOL-001'], usuario_id: admin.id, cantidad: 2,  tipo: 'ENTRADA', observaciones: 'Compra nueva soldadora', fecha: new Date('2025-02-01') },
            { inventario_id: invIds['COM-001'], usuario_id: admin.id, cantidad: 1,  tipo: 'ENTRADA', observaciones: 'Compra compresor usado', fecha: new Date('2025-02-01') },
            // p1: TLD-001 devuelto
            { inventario_id: invIds['TLD-001'], persona_id: juan, usuario_id: operador.id, prestamo_id: p1.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida prestamo - Taladro', fecha: new Date('2025-04-10') },
            { inventario_id: invIds['TLD-001'], persona_id: juan, usuario_id: operador.id, prestamo_id: p1.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Taladro', fecha: new Date('2025-04-12') },
            // p2: LLV-001 activo
            { inventario_id: invIds['LLV-001'], persona_id: maria, usuario_id: operador.id, prestamo_id: p2.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Llaves Allen', fecha: new Date('2025-04-15') },
            // p3: SRA-001 activo
            { inventario_id: invIds['SRA-001'], persona_id: carlos, usuario_id: operador.id, prestamo_id: p3.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Sierra Circular', fecha: new Date('2025-04-20') },
            // p4: DST-001 devuelto
            { inventario_id: invIds['DST-001'], persona_id: ana, usuario_id: cmejia.id, prestamo_id: p4.id, cantidad: 3, tipo: 'SALIDA',  observaciones: 'Salida - Destornilladores', fecha: new Date('2025-05-02') },
            { inventario_id: invIds['DST-001'], persona_id: ana, usuario_id: cmejia.id, prestamo_id: p4.id, cantidad: 3, tipo: 'ENTRADA', observaciones: 'Devolucion - Destornilladores', fecha: new Date('2025-05-05') },
            // p5: CAS-001 activo
            { inventario_id: invIds['CAS-001'], persona_id: luis, usuario_id: rsantana.id, prestamo_id: p5.id, cantidad: 2, tipo: 'SALIDA',  observaciones: 'Salida - Cascos', fecha: new Date('2025-05-05') },
            // p6: FLEX-001 pendiente
            { inventario_id: invIds['FLEX-001'], persona_id: sofia, usuario_id: cmejia.id, prestamo_id: p6.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Flexometro', fecha: new Date('2025-05-08') },
            // p7: MLL-001 activo
            { inventario_id: invIds['MLL-001'], persona_id: pedro, usuario_id: operador.id, prestamo_id: p7.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Martillo', fecha: new Date('2025-05-10') },
            // p8: TLD-002 devuelto
            { inventario_id: invIds['TLD-002'], persona_id: roberto, usuario_id: operador.id, prestamo_id: p8.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Taladro Percutor', fecha: new Date('2025-03-01') },
            { inventario_id: invIds['TLD-002'], persona_id: roberto, usuario_id: operador.id, prestamo_id: p8.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Taladro Percutor', fecha: new Date('2025-03-05') },
            // p9: ESM-001 devuelto
            { inventario_id: invIds['ESM-001'], persona_id: anap, usuario_id: rsantana.id, prestamo_id: p9.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Esmeril', fecha: new Date('2025-03-15') },
            { inventario_id: invIds['ESM-001'], persona_id: anap, usuario_id: rsantana.id, prestamo_id: p9.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Esmeril', fecha: new Date('2025-03-16') },
            // p10: GNT-001 vencido
            { inventario_id: invIds['GNT-001'], persona_id: juan, usuario_id: operador.id, prestamo_id: p10.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Guantes', fecha: new Date('2025-05-01') },
            // p11: TLD-001 devuelto (2do prestamo del mismo item)
            { inventario_id: invIds['TLD-001'], persona_id: ana, usuario_id: operador.id, prestamo_id: p11.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Taladro (2da vez)', fecha: new Date('2025-02-10') },
            { inventario_id: invIds['TLD-001'], persona_id: ana, usuario_id: operador.id, prestamo_id: p11.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Taladro (2da vez)', fecha: new Date('2025-02-12') },
            // p12: TLD-001 devuelto (3er prestamo del mismo item)
            { inventario_id: invIds['TLD-001'], persona_id: roberto, usuario_id: cmejia.id, prestamo_id: p12.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Taladro (3ra vez)', fecha: new Date('2025-01-20') },
            { inventario_id: invIds['TLD-001'], persona_id: roberto, usuario_id: cmejia.id, prestamo_id: p12.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Taladro (3ra vez)', fecha: new Date('2025-01-22') },
            // p13: DST-001 devuelto (2do prestamo)
            { inventario_id: invIds['DST-001'], persona_id: carlos, usuario_id: rsantana.id, prestamo_id: p13.id, cantidad: 2, tipo: 'SALIDA',  observaciones: 'Salida - Destornilladores (2da vez)', fecha: new Date('2025-04-01') },
            { inventario_id: invIds['DST-001'], persona_id: carlos, usuario_id: rsantana.id, prestamo_id: p13.id, cantidad: 2, tipo: 'ENTRADA', observaciones: 'Devolucion - Destornilladores (2da vez)', fecha: new Date('2025-04-03') },
            // p14: DST-001 devuelto (3er prestamo)
            { inventario_id: invIds['DST-001'], persona_id: luis, usuario_id: operador.id, prestamo_id: p14.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Destornilladores (3ra vez)', fecha: new Date('2025-03-10') },
            { inventario_id: invIds['DST-001'], persona_id: luis, usuario_id: operador.id, prestamo_id: p14.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Destornilladores (3ra vez)', fecha: new Date('2025-03-11') },
            // p15: DST-002 activo
            { inventario_id: invIds['DST-002'], persona_id: juan, usuario_id: operador.id, prestamo_id: p15.id, cantidad: 2, tipo: 'SALIDA',  observaciones: 'Salida - Destornilladores Estrella', fecha: new Date('2025-05-01') },
            // p16: DST-002 devuelto
            { inventario_id: invIds['DST-002'], persona_id: maria, usuario_id: cmejia.id, prestamo_id: p16.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Destornillador Estrella', fecha: new Date('2025-04-20') },
            { inventario_id: invIds['DST-002'], persona_id: maria, usuario_id: cmejia.id, prestamo_id: p16.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Destornillador Estrella', fecha: new Date('2025-04-22') },
            // p17: LLV-001 activo (2do prestamo)
            { inventario_id: invIds['LLV-001'], persona_id: sofia, usuario_id: operador.id, prestamo_id: p17.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Llaves (2da vez)', fecha: new Date('2025-05-12') },
            // p18: MLL-001 devuelto (2do prestamo)
            { inventario_id: invIds['MLL-001'], persona_id: anap, usuario_id: rsantana.id, prestamo_id: p18.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Martillo (2da vez)', fecha: new Date('2025-04-25') },
            { inventario_id: invIds['MLL-001'], persona_id: anap, usuario_id: rsantana.id, prestamo_id: p18.id, cantidad: 1, tipo: 'ENTRADA', observaciones: 'Devolucion - Martillo (2da vez)', fecha: new Date('2025-04-26') },
            // p19: CAS-001 activo (2do prestamo)
            { inventario_id: invIds['CAS-001'], persona_id: pedro, usuario_id: operador.id, prestamo_id: p19.id, cantidad: 1, tipo: 'SALIDA',  observaciones: 'Salida - Casco (2da vez)', fecha: new Date('2025-05-08') },
            // p20: LNT-001 pendiente
            { inventario_id: invIds['LNT-001'], persona_id: luis, usuario_id: cmejia.id, prestamo_id: p20.id, cantidad: 2, tipo: 'SALIDA',  observaciones: 'Salida - Lentes', fecha: new Date('2025-05-10') },
            // Traslados
            { inventario_id: invIds['ESM-001'], usuario_id: admin.id, cantidad: 2, tipo: 'TRASLADO', ubicacion_origen_id: ubiIds['TALL-01'], ubicacion_destino_id: ubiIds['TALL-02'], observaciones: 'Reubicacion de esmeriles', fecha: new Date('2025-04-01') },
            { inventario_id: invIds['TLD-001'], usuario_id: admin.id, cantidad: 3, tipo: 'TRASLADO', ubicacion_origen_id: ubiIds['TALL-02'], ubicacion_destino_id: ubiIds['TALL-01'], observaciones: 'Reubicacion de taladros al taller principal', fecha: new Date('2025-03-01') },
            // Ajustes
            { inventario_id: invIds['LIM-001'], usuario_id: admin.id, cantidad: 1, tipo: 'AJUSTE', observaciones: 'Ajuste por rotura de lima', fecha: new Date('2025-05-12') },
            { inventario_id: invIds['PUL-001'], usuario_id: admin.id, cantidad: 1, tipo: 'AJUSTE', observaciones: 'Pulidora dañada en accidente', fecha: new Date('2025-04-20') },
        ],
    });
    console.log('✅ Movimientos creados (40+)');

    console.log('\n✨ ¡Seed completado exitosamente!');
    console.log('   Usuarios: admin/admin | operador/operador123 | auditor/auditor123');
    console.log('   También: cmejia/carlos123 | rsantana/rosa123');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
