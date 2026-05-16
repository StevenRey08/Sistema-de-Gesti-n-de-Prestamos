const { esUUID } = require('../utils/validadores');

const validarPrestamo = (req, res, next) => {
    const { inventario_id, persona_id, instructor_id, cantidad, fecha_prestamo, estado } = req.body;
    const errores = [];

    if (!inventario_id || !esUUID(inventario_id)) errores.push("Falta el artículo (inventario_id) válido.");
    if (!persona_id || !esUUID(persona_id)) errores.push("Falta la persona (persona_id) válida.");
    if (instructor_id && !esUUID(instructor_id)) errores.push("El instructor_id no es un UUID válido.");

    const cantInt = parseInt(cantidad);
    if (isNaN(cantInt) || cantInt <= 0) {
        errores.push("La cantidad debe ser un número entero positivo.");
    }

    if (fecha_prestamo) {
        const fecha = new Date(fecha_prestamo);
        if (isNaN(fecha.getTime())) {
            errores.push("El formato de la fecha de préstamo no es válido.");
        }
    }

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

const validarDevolucion = (req, res, next) => {
    const { id } = req.params;
    const errores = [];

    if (!id || !esUUID(id)) {
        errores.push("El ID del préstamo en la URL debe ser un UUID válido.");
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

module.exports = { validarPrestamo, validarDevolucion };
