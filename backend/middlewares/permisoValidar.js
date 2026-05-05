const { esUUID } = require('../utils/validadores');

const validarPermiso = (req, res, next) => {
    const { rol_id, modulo_id, leer, ingresar, actualizar, eliminar } = req.body;
    const errores = [];

    // 1. Validar Relaciones (UUIDs obligatorios)
    if (!rol_id) {
        errores.push("El ID del rol es obligatorio.");
    } else if (!esUUID(rol_id)) {
        errores.push("El formato del ID de rol no es un UUID válido.");
    }

    if (!modulo_id) {
        errores.push("El ID del módulo es obligatorio.");
    } else if (!esUUID(modulo_id)) {
        errores.push("El formato del ID de módulo no es un UUID válido.");
    }

    // 2. Validar Booleanos
    // Función interna para chequear si el valor es realmente un booleano
    const esBooleano = (valor) => typeof valor === 'boolean';

    if (leer !== undefined && !esBooleano(leer)) {
        errores.push("El campo 'leer' debe ser un valor booleano (true/false).");
    }
    if (ingresar !== undefined && !esBooleano(ingresar)) {
        errores.push("El campo 'ingresar' debe ser un valor booleano (true/false).");
    }
    if (actualizar !== undefined && !esBooleano(actualizar)) {
        errores.push("El campo 'actualizar' debe ser un valor booleano (true/false).");
    }
    if (eliminar !== undefined && !esBooleano(eliminar)) {
        errores.push("El campo 'eliminar' debe ser un valor booleano (true/false).");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de permiso inválidos",
            detalles: errores
        });
    }

    // Si todo está bien, pasamos al controlador
    next();
};

module.exports = { validarPermiso };