const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Iniciando el sembrado de datos...');

    // ── 1. Roles ──────────────────────────────────────────────
    const rolesData = [
        { nombre_rol: 'ADMINISTRADOR', descripcion: 'Control total del sistema' },
        { nombre_rol: 'OPERADOR',      descripcion: 'Gestión de inventario y préstamos' },
        { nombre_rol: 'AUDITOR',       descripcion: 'Solo lectura y reportes' },
    ];

    for (const r of rolesData) {
        await prisma.role.upsert({
            where:  { nombre_rol: r.nombre_rol },
            update: {},
            create: r,
        });
    }
    console.log('✅ Roles creados.');

    // ── 2. Módulos ────────────────────────────────────────────
    const modulosData = [
        { nombre: 'DASHBOARD',    descripcion: 'Panel de control y estadísticas' },
        { nombre: 'USUARIOS',     descripcion: 'Gestión de usuarios y accesos' },
        { nombre: 'INVENTARIO',   descripcion: 'Control de herramientas y materiales' },
        { nombre: 'PRESTAMOS',    descripcion: 'Registro de salidas y entradas de herramientas' },
        { nombre: 'MOVIMIENTOS',  descripcion: 'Historial de traslados y ajustes' },
        { nombre: 'PERSONAS',     descripcion: 'Gestión de beneficiarios y solicitantes' },
        { nombre: 'UBICACIONES',  descripcion: 'Gestión de estantes y cajas' },
        { nombre: 'CATEGORIAS',   descripcion: 'Clasificación de herramientas' },
        { nombre: 'ROLES',        descripcion: 'Gestión de roles del sistema' },
        { nombre: 'PERMISOS',     descripcion: 'Asignación de permisos por rol' },
    ];

    for (const m of modulosData) {
        await prisma.modulo.upsert({
            where:  { nombre: m.nombre },
            update: {},
            create: m,
        });
    }
    console.log('✅ Módulos creados.');

    // ── 3. Usuario Administrador ──────────────────────────────
    const adminRole = await prisma.role.findUnique({ where: { nombre_rol: 'ADMINISTRADOR' } });
    // Se ha eliminado la creación del usuario admin por defecto a petición del usuario.
    // Asegúrate de tener al menos un usuario en la tabla 'usuarios' con rol de ADMINISTRADOR
    // para poder gestionar el sistema.


    // ── 4. Permisos completos para ADMINISTRADOR ──────────────
    const todosLosModulos = await prisma.modulo.findMany();
    const permisoCompleto = { leer: true, ingresar: true, actualizar: true, eliminar: true };

    for (const modulo of todosLosModulos) {
        await prisma.permiso.upsert({
            where:  { rol_id_modulo_id: { rol_id: adminRole.id, modulo_id: modulo.id } },
            update: permisoCompleto,
            create: { rol_id: adminRole.id, modulo_id: modulo.id, ...permisoCompleto },
        });
    }
    console.log('✅ Permisos completos asignados al rol ADMINISTRADOR.');

    // ── 5. Permisos de solo lectura para AUDITOR ──────────────
    const auditorRole = await prisma.role.findUnique({ where: { nombre_rol: 'AUDITOR' } });
    const permisoLectura = { leer: true, ingresar: false, actualizar: false, eliminar: false };

    for (const modulo of todosLosModulos) {
        await prisma.permiso.upsert({
            where:  { rol_id_modulo_id: { rol_id: auditorRole.id, modulo_id: modulo.id } },
            update: permisoLectura,
            create: { rol_id: auditorRole.id, modulo_id: modulo.id, ...permisoLectura },
        });
    }
    console.log('✅ Permisos de lectura asignados al rol AUDITOR.');

    // ── 6. Permisos de gestión para OPERADOR (sin usuarios/roles/permisos) ──
    const operadorRole = await prisma.role.findUnique({ where: { nombre_rol: 'OPERADOR' } });
    const modulosRestringidos = ['USUARIOS', 'ROLES', 'PERMISOS'];

    for (const modulo of todosLosModulos) {
        const esRestringido = modulosRestringidos.includes(modulo.nombre);
        const permisoOp = esRestringido
            ? { leer: false, ingresar: false, actualizar: false, eliminar: false }
            : { leer: true,  ingresar: true,  actualizar: true,  eliminar: false };

        await prisma.permiso.upsert({
            where:  { rol_id_modulo_id: { rol_id: operadorRole.id, modulo_id: modulo.id } },
            update: permisoOp,
            create: { rol_id: operadorRole.id, modulo_id: modulo.id, ...permisoOp },
        });
    }
    console.log('✅ Permisos asignados al rol OPERADOR.');

    console.log('\n✨ ¡Seed completado! El sistema está listo.');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
