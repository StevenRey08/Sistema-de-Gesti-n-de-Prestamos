const { prisma } = require('../db');

const sesionController = {
    getAll: async (req, res) => {
        const { usuario_id } = req.query;
        try {
            const where = { activa: true };
            if (usuario_id) where.usuario_id = usuario_id;

            const sesiones = await prisma.sesion.findMany({
                where,
                include: {
                    usuario: {
                        select: { id: true, nombre: true, apellido: true, usuario: true, rol: { select: { nombre_rol: true } }, activo: true }
                    }
                },
                orderBy: { fecha_login: 'desc' },
            });

            res.json(sesiones);
        } catch (error) {
            console.error('Error al obtener sesiones:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener sesiones activas" });
        }
    },

    revoke: async (req, res) => {
        const { id } = req.params;
        try {
            const sesion = await prisma.sesion.findUnique({ where: { id } });
            
            if (!sesion) {
                return res.status(404).json({ status: "error", mensaje: "Sesión no encontrada" });
            }

            await prisma.sesion.update({
                where: { id },
                data: {
                    activa: false,
                    fecha_logout: new Date()
                }
            });

            res.json({ message: "Sesión revocada correctamente" });
        } catch (error) {
            console.error('Error al revocar sesión:', error);
            res.status(500).json({ status: "error", mensaje: "Error al revocar sesión" });
        }
    },

    revokeAllByUser: async (req, res) => {
        const { usuario_id } = req.params;
        try {
            await prisma.sesion.updateMany({
                where: {
                    usuario_id,
                    activa: true
                },
                data: {
                    activa: false,
                    fecha_logout: new Date()
                }
            });

            res.json({ message: "Todas las sesiones del usuario han sido revocadas" });
        } catch (error) {
            console.error('Error al revocar sesiones:', error);
            res.status(500).json({ status: "error", mensaje: "Error al revocar sesiones" });
        }
    },

    cleanExpired: async (req, res) => {
        try {
            const expiredHours = 8;
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - expiredHours);

            const result = await prisma.sesion.updateMany({
                where: {
                    activa: true,
                    fecha_login: { lt: cutoffDate }
                },
                data: {
                    activa: false,
                    fecha_logout: cutoffDate
                }
            });

            res.json({ message: `Se limpiaron ${result.count} sesiones expiradas`, count: result.count });
        } catch (error) {
            console.error('Error al limpiar sesiones:', error);
            res.status(500).json({ status: "error", mensaje: "Error al limpiar sesiones expiradas" });
        }
    },

    getByCurrentUser: async (req, res) => {
        try {
            const sesiones = await prisma.sesion.findMany({
                where: {
                    usuario_id: req.usuario.id,
                    activa: true
                },
                orderBy: { fecha_login: 'desc' },
            });

            res.json(sesiones);
        } catch (error) {
            console.error('Error al obtener sesiones:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener sesiones" });
        }
    }
};

module.exports = sesionController;
