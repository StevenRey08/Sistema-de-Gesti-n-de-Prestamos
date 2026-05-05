const { esUUID } = require('../utils/validadores');

/**
 * Valida la creación de un nuevo préstamo
 */
const validarPrestamo = (req, res, next) => {
    const {
        inventario_id, persona_id, usuario_id,
        cantidad, fecha_prestamo, estado
    } = req.body;

    const errores = [];

    // 1. Validar Relaciones Obligatorias
    if (!inventario_id || !esUUID(inventario_id)) errores.push("Falta el artículo (inventario_id) válido.");
    if (!persona_id || !esUUID(persona_id)) errores.push("Falta la persona (persona_id) válida.");
    if (!usuario_id || !esUUID(usuario_id)) errores.push("Falta el usuario (usuario_id) válido.");

    // 2. Validar Cantidad
    // Convertimos a Int por si llega como String desde el form
    const cantInt = parseInt(cantidad);
    if (isNaN(cantInt) || cantInt <= 0) {
        errores.push("La cantidad debe ser un número entero positivo.");
    }

    // 3. Validar Fecha de Préstamo (si se provee)
    if (fecha_prestamo) {
        const fecha = new Date(fecha_prestamo);
        if (isNaN(fecha.getTime())) {
            errores.push("El formato de la fecha de préstamo no es válido.");
        }
    }

    // 4. Validar Estado (Consistente con la lógica del controlador)
    // Por defecto al crear suele ser 'ACTIVO'
    const estadosPermitidos = ["ACTIVO", "DEVUELTO", "VENCIDO"];
    if (estado && !estadosPermitidos.includes(estado.toUpperCase())) {
        errores.push("Estado no válido. Use: ACTIVO, DEVUELTO o VENCIDO.");
    }

    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de préstamo inválidos",
            detalles: errores
        });
    }

    next();
};

/**
 * Valida el proceso de devolución de un préstamo existente
 */
const validarDevolucion = (req, res, next) => {
    const { id } = req.params; // ID del préstamo que viene en la URL
    const { usuario_id, estado_fisico } = req.body;

    const errores = [];

    if (!id || !esUUID(id)) {
        errores.push("El ID del préstamo en la URL debe ser un UUID válido.");
    }

    if (!usuario_id || !esUUID(usuario_id)) {
        errores.push("El usuario_id (quien recibe la herramienta) es obligatorio.");
    }

    // Opcional: Validar que el estado físico sea coherente
    const estadosFisicosPosibles = ["EXCELENTE", "BUENO", "DESGASTADO", "DAÑADO"];
    if (estado_fisico && !estadosFisicosPosibles.includes(estado_fisico.toUpperCase())) {
        // No bloqueamos, pero podrías normalizarlo o avisar
    }

    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de devolución incompletos",
            detalles: errores
        });
    }

    next();
};

module.exports = {
    validarPrestamo,
    validarDevolucion
};