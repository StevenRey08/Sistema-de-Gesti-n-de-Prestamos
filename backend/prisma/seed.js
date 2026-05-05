const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando el sembrado de datos (Seeding)...');

    // 1. Crear Roles básicos
    const roles = [
        { nombre_rol: 'ADMINISTRADOR', descripcion: 'Control total del sistema' },
        { nombre_rol: 'OPERADOR', descripcion: 'Gestión de inventario y préstamos' },
        { nombre_rol: 'AUDITOR', descripcion: 'Solo lectura y reportes' }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { nombre_rol: role.nombre_rol },
            update: {},
            create: role
        });
    }
    console.log('✅ Roles creados.');

    // 2. Crear Módulos por defecto
    const modulos = [
        { nombre: 'USUARIOS', descripcion: 'Gestión de usuarios y accesos' },
        { nombre: 'INVENTARIO', descripcion: 'Control de herramientas y materiales' },
        { nombre: 'PRESTAMOS', descripcion: 'Registro de salidas y entradas de herramientas' },
        { nombre: 'MOVIMIENTOS', descripcion: 'Historial de traslados y ajustes' },
        { nombre: 'PERSONAS', descripcion: 'Gestión de beneficiarios y solicitantes' }
    ];

    for (const modulo of modulos) {
        await prisma.modulo.upsert({
            where: { nombre: modulo.nombre },
            update: {},
            create: modulo
        });
    }
    console.log('✅ Módulos creados.');

    // 3. Crear el primer Usuario Administrador
    const adminRole = await prisma.role.findUnique({ where: { nombre_rol: 'ADMINISTRADOR' } });
    
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPass = await bcrypt.hash('admin123456', salt);

    await prisma.usuario.upsert({
        where: { usuario: 'admin' },
        update: {},
        create: {
            nombre: 'Admin',
            apellido: 'Sistema',
            usuario: 'admin',
            contrasena: hashedAdminPass,
            rol_id: adminRole.id,
            activo: true
        }
    });
    console.log('✅ Usuario administrador creado (user: admin, pass: admin123456).');

    console.log('✨ Sembrado completado con éxito.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
