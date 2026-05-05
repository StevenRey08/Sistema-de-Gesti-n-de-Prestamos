const { prisma } = require('../db');

// Esta función recibe el módulo y la acción que se intenta realizar
const tienePermiso = (nombreModulo, accion) => {
    return async (req, res, next) => {
        const { rol_id } = req.usuario; // Extraído previamente del Token

        try {
            const permiso = await prisma.permiso.findFirst({
                where: {
                    rol_id: rol_id,
                    modulo: { nombre: nombreModulo }
                }
            });

            // Si no hay registro de permiso o la acción (leer, ingresar, etc) es false
            if (!permiso || !permiso[accion]) {
                return res.status(403).json({
                    error: `Acceso denegado: No tienes permiso para ${accion} en ${nombreModulo}`
                });
            }

            next(); // Si tiene permiso, continúa al controlador
        } catch (error) {
            res.status(500).json({ error: "Error al verificar permisos" });
        }
    };
};