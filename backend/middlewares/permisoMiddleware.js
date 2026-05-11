const { prisma } = require('../db');
const logger = require('../utils/logger');

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
                return res.status(403).json({ status: "error", mensaje: "No tienes un rol asignado" });
            }

            // Normalizar a mayúsculas para consistencia con BD
            const modulo = nombreModulo.toUpperCase();

            const permiso = await prisma.permiso.findFirst({
                where: {
                    rol_id: rol_id,
                    modulo: {
                        nombre: modulo
                    }
                }
            });

            if (!permiso) {
                return res.status(403).json({ status: "error", mensaje: `No tienes permisos para el módulo ${modulo}` });
            }

            if (!permiso[accion]) {
                return res.status(403).json({ status: "error", mensaje: `No tienes permiso para ${accion} en ${modulo}` });
            }

            next();
        } catch (error) {
            logger.error("Error en checkPermiso:", error);
            res.status(500).json({ status: "error", mensaje: "Error al verificar permisos" });
        }
    };
};

module.exports = { checkPermiso };
