const validarCategoria = (req, res, next) => {
    const { nombre, descripcion } = req.body;
    const errores = [];

    // 1. Validar nombre (Obligatorio y único en DB)
    if (!nombre || nombre.trim() === "") {
        errores.push("El nombre de la categoría es obligatorio.");
    } else if (nombre.length > 100) {
        errores.push("El nombre de la categoría no puede exceder los 100 caracteres.");
    }

    // 2. Validar descripción (Opcional)
    if (descripcion && descripcion.length > 500) {
        errores.push("La descripción es demasiado larga (máximo 500 caracteres).");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de categoría inválidos",
            detalles: errores
        });
    }

    // Si todo está correcto, pasamos al controlador
    next();
};

module.exports = { validarCategoria };