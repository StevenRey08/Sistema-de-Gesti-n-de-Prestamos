const validarRole = (req, res, next) => {
    const { nombre_rol, descripcion } = req.body;
    const errores = [];

    // 1. Validar nombre_rol (Obligatorio y longitud)
    if (!nombre_rol || nombre_rol.trim() === "") {
        errores.push("El nombre del rol es obligatorio.");
    } else {
        if (nombre_rol.length > 30) {
            errores.push("El nombre del rol no puede exceder los 30 caracteres.");
        }
        if (nombre_rol.length < 4) {
            errores.push("El nombre del rol es demasiado corto (mínimo 4 caracteres).");
        }
    }

    // 2. Validar descripción (Opcional, pero limitamos longitud por seguridad)
    if (descripcion && descripcion.length > 200) {
        errores.push("La descripción es demasiado larga (máximo 200 caracteres).");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de rol inválidos",
            detalles: errores
        });
    }

    // Si todo está bien, pasamos al controlador
    next();
};

module.exports = { validarRole };