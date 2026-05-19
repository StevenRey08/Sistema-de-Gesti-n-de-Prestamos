const { prisma } = require('../db');
const { invalidateCache } = require('../utils/politicasSeguridad');

const politicasController = {
    getAll: async (req, res) => {
        try {
            const politicas = await prisma.politicaSeguridad.findMany({
                include: {
                    modificado_por: {
                        select: { id: true, nombre: true, apellido: true, usuario: true }
                    }
                },
                orderBy: { clave: 'asc' }
            });

            res.json(politicas);
        } catch (error) {
            console.error('Error al obtener políticas:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener políticas de seguridad" });
        }
    },

    update: async (req, res) => {
        const { id } = req.params;
        const { valor, descripcion } = req.body;

        try {
            const politica = await prisma.politicaSeguridad.findUnique({ where: { id } });
            
            if (!politica) {
                return res.status(404).json({ status: "error", mensaje: "Política no encontrada" });
            }

            const updated = await prisma.politicaSeguridad.update({
                where: { id },
                data: {
                    valor,
                    descripcion: descripcion ?? politica.descripcion,
                    ultima_modificacion: new Date(),
                    modificado_por_id: req.usuario.id
                },
                include: {
                    modificado_por: {
                        select: { id: true, nombre: true, apellido: true, usuario: true }
                    }
                }
            });

            invalidateCache();

            res.json(updated);
        } catch (error) {
            console.error('Error al actualizar política:', error);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar la política" });
        }
    },

    getByKey: async (req, res) => {
        const { clave } = req.params;
        try {
            const politica = await prisma.politicaSeguridad.findUnique({ where: { clave } });
            
            if (!politica) {
                return res.status(404).json({ status: "error", mensaje: "Política no encontrada" });
            }

            res.json(politica);
        } catch (error) {
            console.error('Error al obtener política:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener la política" });
        }
    },

    seedDefaultPolicies: async (req, res) => {
        try {
            const defaultPolicies = [
                {
                    clave: 'PASSWORD_MIN_LENGTH',
                    valor: '6',
                    descripcion: 'Longitud mínima de la contraseña'
                },
                {
                    clave: 'PASSWORD_REQUIRE_UPPERCASE',
                    valor: 'false',
                    descripcion: 'Requerir al menos una letra mayúscula'
                },
                {
                    clave: 'PASSWORD_REQUIRE_LOWERCASE',
                    valor: 'false',
                    descripcion: 'Requerir al menos una letra minúscula'
                },
                {
                    clave: 'PASSWORD_REQUIRE_NUMBER',
                    valor: 'false',
                    descripcion: 'Requerir al menos un número'
                },
                {
                    clave: 'PASSWORD_REQUIRE_SPECIAL',
                    valor: 'false',
                    descripcion: 'Requerir al menos un carácter especial'
                },
                {
                    clave: 'PASSWORD_EXPIRY_DAYS',
                    valor: '0',
                    descripcion: 'Días de expiración de contraseña (0 = sin expiración)'
                },
                {
                    clave: 'MAX_FAILED_LOGIN_ATTEMPTS',
                    valor: '5',
                    descripcion: 'Número máximo de intentos fallidos antes de bloqueo'
                },
                {
                    clave: 'LOCKOUT_DURATION_MINUTES',
                    valor: '15',
                    descripcion: 'Duración del bloqueo en minutos'
                },
                {
                    clave: 'SESSION_TIMEOUT_HOURS',
                    valor: '8',
                    descripcion: 'Tiempo de expiración de sesión en horas'
                },
                {
                    clave: 'AUDIT_LOG_RETENTION_DAYS',
                    valor: '90',
                    descripcion: 'Días de retención de logs de auditoría'
                },
            ];

            const created = [];
            for (const policy of defaultPolicies) {
                const exists = await prisma.politicaSeguridad.findUnique({ where: { clave: policy.clave } });
                if (!exists) {
                    const nuevo = await prisma.politicaSeguridad.create({ data: policy });
                    created.push(nuevo);
                }
            }

            invalidateCache();

            res.json({ message: `Políticas creadas: ${created.length}`, data: created });
        } catch (error) {
            console.error('Error al crear políticas por defecto:', error);
            res.status(500).json({ status: "error", mensaje: "Error al crear políticas por defecto" });
        }
    }
};

module.exports = politicasController;
