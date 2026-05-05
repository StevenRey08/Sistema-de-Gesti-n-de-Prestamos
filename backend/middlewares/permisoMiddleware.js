const { prisma } = require('../db');

/**
 * Middleware para verificar permisos dinámicos basados en la base de datos
 * @param {string} nombreModulo - Nombre del módulo (ej: 'Inventario', 'Usuarios')
 * @param {string} accion - Acción a verificar ('leer', 'ingresar', 'actualizar', 'eliminar')
 */
const checkPermiso = (nombreModulo, accion) => {
    return async (req, res, next) => {
        try {
            const { rol_id } = req.usuario; // Extraído por verificarToken

            if (!rol_id) {
                return res.status(403).json({ error: "No tienes un rol asignado" });
            }

            // Buscar el permiso para este rol y este módulo
            const permiso = await prisma.permiso.findFirst({
                where: {
                    rol_id: rol_id,
                    modulo: {
                        nombre: {
                            contains: nombreModulo,
                            mode: 'insensitive'
                        }
                    }
                }
            });

            if (!permiso) {
                return res.status(403).json({ error: `No tienes permisos para el módulo ${nombreModulo}` });
            }

            // Verificar la acción específica
            if (!permiso[accion]) {
                return res.status(403).json({ error: `No tienes permiso para ${accion} en ${nombreModulo}` });
            }

            next();
        } catch (error) {
            console.error("Error en checkPermiso:", error);
            res.status(500).json({ error: "Error al verificar permisos" });
        }
    };
};

module.exports = { checkPermiso };
