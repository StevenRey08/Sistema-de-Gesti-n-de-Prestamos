const { prisma } = require('../db');

const auditoriaController = {
    getAll: async (req, res) => {
        const { search, accion, modulo, fecha_inicio, fecha_fin, usuario_id } = req.query;
        try {
            const where = {};

            if (search) {
                where.OR = [
                    { descripcion: { contains: search, mode: 'insensitive' } },
                    { usuario: { nombre: { contains: search, mode: 'insensitive' } } },
                    { usuario: { apellido: { contains: search, mode: 'insensitive' } } },
                ];
            }

            if (accion) where.accion = accion;
            if (modulo) where.modulo = modulo;
            if (usuario_id) where.usuario_id = usuario_id;

            if (fecha_inicio || fecha_fin) {
                where.fecha = {};
                if (fecha_inicio) where.fecha.gte = new Date(fecha_inicio);
                if (fecha_fin) where.fecha.lte = new Date(fecha_fin);
            }

            const logs = await prisma.auditoriaLog.findMany({
                where,
                include: {
                    usuario: {
                        select: { id: true, nombre: true, apellido: true, usuario: true, rol: { select: { nombre_rol: true } } }
                    }
                },
                orderBy: { fecha: 'desc' },
                take: 500,
            });

            res.json(logs);
        } catch (error) {
            console.error('Error al obtener logs de auditoría:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener logs de auditoría" });
        }
    },

    getStats: async (req, res) => {
        try {
            const totalLogs = await prisma.auditoriaLog.count();
            
            const logsByAccion = await prisma.auditoriaLog.groupBy({
                by: ['accion'],
                _count: true,
                orderBy: { _count: { accion: 'desc' } },
                take: 10,
            });

            const logsByModulo = await prisma.auditoriaLog.groupBy({
                by: ['modulo'],
                _count: true,
                orderBy: { _count: { modulo: 'desc' } },
                take: 10,
            });

            const recentLogins = await prisma.auditoriaLog.count({
                where: {
                    accion: 'LOGIN',
                    fecha: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });

            const failedLogins = await prisma.auditoriaLog.count({
                where: {
                    accion: 'LOGIN_FALLIDO',
                    fecha: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });

            res.json({
                totalLogs,
                logsByAccion,
                logsByModulo,
                recentLogins,
                failedLogins,
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener estadísticas" });
        }
    },

    exportLogs: async (req, res) => {
        try {
            const logs = await prisma.auditoriaLog.findMany({
                include: {
                    usuario: {
                        select: { id: true, nombre: true, apellido: true, usuario: true }
                    }
                },
                orderBy: { fecha: 'desc' },
            });

            const csvHeader = 'Fecha,Usuario,Accion,Modulo,Descripcion,IP\n';
            const csvRows = logs.map(log => {
                const usuario = log.usuario ? `${log.usuario.nombre} ${log.usuario.apellido}` : 'Sistema';
                const desc = (log.descripcion || '').replace(/"/g, '""');
                return `"${log.fecha}","${usuario}","${log.accion}","${log.modulo}","${desc}","${log.ip || ''}"`;
            }).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=auditoria_logs.csv');
            res.send(csvHeader + csvRows);
        } catch (error) {
            console.error('Error al exportar logs:', error);
            res.status(500).json({ status: "error", mensaje: "Error al exportar logs" });
        }
    },

    cleanOldLogs: async (req, res) => {
        const { dias } = req.body;
        const daysToKeep = dias || 90;
        
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await prisma.auditoriaLog.deleteMany({
                where: {
                    fecha: { lt: cutoffDate }
                }
            });

            res.json({ message: `Se eliminaron ${result.count} registros antiguos`, count: result.count });
        } catch (error) {
            console.error('Error al limpiar logs:', error);
            res.status(500).json({ status: "error", mensaje: "Error al limpiar logs antiguos" });
        }
    }
};

module.exports = auditoriaController;
