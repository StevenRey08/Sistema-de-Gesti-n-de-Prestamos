const { esUUID } = require('../utils/validadores');

const validarUbicacion = (req, res, next) => {
    const { nombre, tipo, descripcion, ubicacion_padre_id, codigo } = req.body;
    const errores = [];

    // 1. Validar nombre (Obligatorio)
    if (!nombre || nombre.trim() === "") {
        errores.push("El nombre de la ubicación es obligatorio.");
    } else if (nombre.length > 100) {
        errores.push("El nombre es demasiado largo (máximo 100 caracteres).");
    }

    // 2. Validar tipo (Obligatorio y debe ser uno de los permitidos)
    const tiposPermitidos = ['ESTANTE', 'CAJA', 'ESTUCHE'];
    if (!tipo || tipo.trim() === "") {
        errores.push("El tipo de ubicación es obligatorio (ESTANTE, CAJA, ESTUCHE).");
    } else if (!tiposPermitidos.includes(tipo.toUpperCase())) {
        errores.push(`Tipo no válido. Debe ser uno de los siguientes: ${tiposPermitidos.join(', ')}.`);
    }

    // 3. Validar ubicacion_padre_id (Opcional, pero si viene debe ser un UUID)
    if (ubicacion_padre_id) {
        if (!esUUID(ubicacion_padre_id)) {
            errores.push("El ID de la ubicación padre debe ser un UUID válido.");
        }
    }

    // 4. Validar código (Opcional en el body porque lo generas automático, pero validamos longitud)
    if (codigo && codigo.length > 50) {
        errores.push("El código manual no puede exceder los 50 caracteres.");
    }

    // 5. Validar descripción (Opcional)
    if (descripcion && descripcion.length > 500) {
        errores.push("La descripción es demasiado larga (máximo 500 caracteres).");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de ubicación inválidos",
            detalles: errores
        });
    }

    // Si todo está bien, pasamos al controlador
    next();
};

module.exports = { validarUbicacion };