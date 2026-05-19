const { prisma } = require('../db');
const bcrypt = require('bcrypt');

async function main() {
    console.log('Creando roles...');
    const adminRole = await prisma.role.upsert({
        where: { nombre_rol: 'Administrador' },
        update: {},
        create: { nombre_rol: 'Administrador', descripcion: 'Acceso completo al sistema', protegido: true }
    });

    const operadorRole = await prisma.role.upsert({
        where: { nombre_rol: 'Operador' },
        update: {},
        create: { nombre_rol: 'Operador', descripcion: 'Acceso limitado a inventario y préstamos', protegido: false }
    });

    console.log('Roles creados:', adminRole.nombre_rol, operadorRole.nombre_rol);

    console.log('Creando módulos...');
    const defaultModules = [
        { nombre: 'DASHBOARD', descripcion: 'Panel principal', ruta: '/', icono: 'home', orden: 0 },
        { nombre: 'INVENTARIO', descripcion: 'Gestión de inventario y herramientas', ruta: '/inventario', icono: 'tool', orden: 1 },
        { nombre: 'PERSONAS', descripcion: 'Gestión de personas (estudiantes, instructores)', ruta: '/catalogos/personas', icono: 'users', orden: 2 },
        { nombre: 'PRESTAMOS', descripcion: 'Gestión de préstamos y devoluciones', ruta: '/prestamos', icono: 'handshake', orden: 3 },
        { nombre: 'MOVIMIENTOS', descripcion: 'Historial de movimientos de inventario', ruta: '/movimientos', icono: 'arrow-right-arrow-left', orden: 4 },
        { nombre: 'PEDIDOS', descripcion: 'Gestión de pedidos y abastecimiento', ruta: '/pedidos', icono: 'shopping-cart', orden: 5 },
        { nombre: 'UBICACIONES', descripcion: 'Gestión de ubicaciones físicas', ruta: '/ubicaciones', icono: 'map-pin', orden: 6 },
        { nombre: 'CATEGORIAS', descripcion: 'Categorías de herramientas', ruta: '/catalogos/categorias', icono: 'folder', orden: 7 },
        { nombre: 'REPORTES', descripcion: 'Reportes y estadísticas', ruta: '/reportes', icono: 'chart-bar', orden: 8 },
        { nombre: 'USUARIOS', descripcion: 'Gestión de usuarios del sistema', ruta: '/seguridad', icono: 'shield', orden: 9 },
    ];

    const modulos = [];
    for (const mod of defaultModules) {
        const m = await prisma.modulo.upsert({
            where: { nombre: mod.nombre },
            update: {},
            create: mod
        });
        modulos.push(m);
    }
    console.log('Módulos creados:', modulos.length);

    console.log('Creando permisos...');
    for (const mod of modulos) {
        await prisma.permiso.upsert({
            where: { rol_id_modulo_id: { rol_id: adminRole.id, modulo_id: mod.id } },
            update: {},
            create: {
                rol_id: adminRole.id,
                modulo_id: mod.id,
                leer: true,
                ingresar: true,
                actualizar: true,
                eliminar: true,
            }
        });
    }

    const inventarioMod = modulos.find(m => m.nombre === 'INVENTARIO');
    if (inventarioMod) {
        await prisma.permiso.upsert({
            where: { rol_id_modulo_id: { rol_id: operadorRole.id, modulo_id: inventarioMod.id } },
            update: {},
            create: {
                rol_id: operadorRole.id,
                modulo_id: inventarioMod.id,
                leer: true,
                ingresar: true,
                actualizar: false,
                eliminar: false,
            }
        });
    }

    console.log('Permisos creados');

    console.log('Creando usuario administrador...');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.usuario.upsert({
        where: { usuario: 'admin' },
        update: { contrasena: hashedPassword },
        create: {
            usuario: 'admin',
            contrasena: hashedPassword,
            nombre: 'Administrador',
            apellido: 'Sistema',
            email: 'admin@sistema.com',
            rol_id: adminRole.id,
            activo: true,
        }
    });

    console.log('Usuario admin creado:', adminUser.usuario);

    const operadorPassword = await bcrypt.hash('operador123', 12);

    const operadorUser = await prisma.usuario.upsert({
        where: { usuario: 'operador' },
        update: { contrasena: operadorPassword },
        create: {
            usuario: 'operador',
            contrasena: operadorPassword,
            nombre: 'Operador',
            apellido: 'Inventario',
            email: 'operador@sistema.com',
            rol_id: operadorRole.id,
            activo: true,
        }
    });

    console.log('Usuario operador creado:', operadorUser.usuario);

    console.log('Creando políticas de seguridad...');
    const defaultPolicies = [
        { clave: 'PASSWORD_MIN_LENGTH', valor: '6', descripcion: 'Longitud mínima de la contraseña' },
        { clave: 'PASSWORD_REQUIRE_UPPERCASE', valor: 'false', descripcion: 'Requerir al menos una letra mayúscula' },
        { clave: 'PASSWORD_REQUIRE_LOWERCASE', valor: 'false', descripcion: 'Requerir al menos una letra minúscula' },
        { clave: 'PASSWORD_REQUIRE_NUMBER', valor: 'false', descripcion: 'Requerir al menos un número' },
        { clave: 'PASSWORD_REQUIRE_SPECIAL', valor: 'false', descripcion: 'Requerir al menos un carácter especial' },
        { clave: 'PASSWORD_EXPIRY_DAYS', valor: '0', descripcion: 'Días de expiración de contraseña (0 = sin expiración)' },
        { clave: 'MAX_FAILED_LOGIN_ATTEMPTS', valor: '5', descripcion: 'Número máximo de intentos fallidos antes de bloqueo' },
        { clave: 'LOCKOUT_DURATION_MINUTES', valor: '15', descripcion: 'Duración del bloqueo en minutos' },
        { clave: 'SESSION_TIMEOUT_HOURS', valor: '8', descripcion: 'Tiempo de expiración de sesión en horas' },
        { clave: 'AUDIT_LOG_RETENTION_DAYS', valor: '90', descripcion: 'Días de retención de logs de auditoría' },
    ];

    for (const policy of defaultPolicies) {
        await prisma.politicaSeguridad.upsert({
            where: { clave: policy.clave },
            update: {},
            create: policy
        });
    }
    console.log('Políticas creadas:', defaultPolicies.length);

    console.log('\n¡Listo! Credenciales:');
    console.log('  Admin:    admin / admin123');
    console.log('  Operador: operador / operador123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); });
