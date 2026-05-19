const { prisma } = require('../db');

const reportesSeguridadController = {
    getDashboard: async (req, res) => {
        try {
            const totalUsuarios = await prisma.usuario.count();
            const usuariosActivos = await prisma.usuario.count({ where: { activo: true } });
            const usuariosInactivos = totalUsuarios - usuariosActivos;
            
            const sesionesActivas = await prisma.sesion.count({ where: { activa: true } });
            
            const totalRoles = await prisma.role.count();
            
            const totalPermisos = await prisma.permiso.count();
            
            const logsHoy = await prisma.auditoriaLog.count({
                where: {
                    fecha: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            const loginFallidosHoy = await prisma.auditoriaLog.count({
                where: {
                    accion: 'LOGIN_FALLIDO',
                    fecha: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            const usuariosBloqueados = await prisma.usuario.count({
                where: {
                    bloqueado_hasta: {
                        gte: new Date()
                    }
                }
            });

            const topAcciones = await prisma.auditoriaLog.groupBy({
                by: ['accion'],
                _count: true,
                orderBy: { _count: { accion: 'desc' } },
                take: 5,
                where: {
                    fecha: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            const usuariosPorRol = await prisma.usuario.groupBy({
                by: ['rol_id'],
                _count: true,
                orderBy: { _count: { rol_id: 'desc' } },
            });

            const roles = await prisma.role.findMany({
                where: {
                    id: { in: usuariosPorRol.map(u => u.rol_id).filter(Boolean) }
                },
                select: { id: true, nombre_rol: true }
            });

            const usuariosPorRolConNombre = usuariosPorRol.map(u => {
                const rol = roles.find(r => r.id === u.rol_id);
                return {
                    rol: rol ? rol.nombre_rol : 'Sin rol',
                    count: u._count
                };
            });

            res.json({
                totalUsuarios,
                usuariosActivos,
                usuariosInactivos,
                sesionesActivas,
                totalRoles,
                totalPermisos,
                logsHoy,
                loginFallidosHoy,
                usuariosBloqueados,
                topAcciones,
                usuariosPorRol: usuariosPorRolConNombre,
            });
        } catch (error) {
            console.error('Error al obtener reporte de seguridad:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener reporte de seguridad" });
        }
    },

    getActividadUsuario: async (req, res) => {
        const { usuario_id } = req.params;
        const { dias = 30 } = req.query;

        try {
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

            const logs = await prisma.auditoriaLog.findMany({
                where: {
                    usuario_id,
                    fecha: { gte: fechaInicio }
                },
                orderBy: { fecha: 'desc' },
                take: 200,
            });

            const stats = await prisma.auditoriaLog.groupBy({
                by: ['accion'],
                _count: true,
                where: {
                    usuario_id,
                    fecha: { gte: fechaInicio }
                },
            });

            res.json({ logs, stats });
        } catch (error) {
            console.error('Error al obtener actividad del usuario:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener actividad del usuario" });
        }
    },

    getUsuariosRiesgo: async (req, res) => {
        try {
            const usuarios = await prisma.usuario.findMany({
                where: {
                    OR: [
                        { intentos_fallidos: { gt: 0 } },
                        { bloqueado_hasta: { gte: new Date() } },
                        { activo: false },
                    ]
                },
                include: {
                    rol: { select: { nombre_rol: true } }
                },
                orderBy: { intentos_fallidos: 'desc' }
            });

            const usuariosRiesgo = usuarios.map(u => ({
                id: u.id,
                nombre: `${u.nombre} ${u.apellido}`,
                usuario: u.usuario,
                email: u.email,
                rol: u.rol?.nombre_rol || 'Sin rol',
                activo: u.activo,
                intentos_fallidos: u.intentos_fallidos,
                bloqueado_hasta: u.bloqueado_hasta,
                nivel_riesgo: u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date() ? 'alto' : 
                              u.intentos_fallidos > 0 ? 'medio' : 'bajo'
            }));

            res.json(usuariosRiesgo);
        } catch (error) {
            console.error('Error al obtener usuarios de riesgo:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener usuarios de riesgo" });
        }
    },

    resetIntentosFallidos: async (req, res) => {
        const { usuario_id } = req.params;

        try {
            await prisma.usuario.update({
                where: { id: usuario_id },
                data: {
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                    activo: true
                }
            });

            res.json({ message: "Intentos fallidos reiniciados correctamente" });
        } catch (error) {
            console.error('Error al reiniciar intentos:', error);
            res.status(500).json({ status: "error", mensaje: "Error al reiniciar intentos fallidos" });
        }
    }
};

module.exports = reportesSeguridadController;
