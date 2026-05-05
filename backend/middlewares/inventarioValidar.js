const { esUUID } = require('../utils/validadores'); // Asegúrate de tener esta función en tus utilidades

const validarInventario = (req, res, next) => {
    const { nombre, codigo, categoria_id, ubicacion_id, estado, cantidad, cantidad_minima } = req.body;
    const errores = [];

    // 1. Validar Nombre (Obligatorio)
    if (!nombre || nombre.trim() === "") {
        errores.push("El nombre del artículo es obligatorio.");
    } else if (nombre.length > 150) {
        errores.push("El nombre no puede exceder los 150 caracteres.");
    }

    // 2. Validar Código (Opcional en el body porque tu controller lo genera, pero si viene, se valida)
    if (codigo && codigo.length > 50) {
        errores.push("El código no puede exceder los 50 caracteres.");
    }

    // 3. Validar Categoría ID (Debe ser UUID si se proporciona)
    if (categoria_id && !esUUID(categoria_id)) {
        errores.push("El ID de categoría no es un UUID válido.");
    }

    // 4. Validar Ubicación ID (Debe ser UUID si se proporciona)
    if (ubicacion_id && !esUUID(ubicacion_id)) {
        errores.push("El ID de ubicación no es un UUID válido.");
    }

    // 5. Validar Estado
    if (estado && estado.length > 50) {
        errores.push("El estado no puede exceder los 50 caracteres.");
    }

    // 6. Validar Cantidad Actual
    if (cantidad !== undefined && cantidad !== null) {
        if (!Number.isInteger(Number(cantidad)) || Number(cantidad) < 0) {
            errores.push("La cantidad debe ser un número entero mayor o igual a 0.");
        }
    }

    // 7. Validar Stock Mínimo
    if (cantidad_minima !== undefined && cantidad_minima !== null) {
        if (!Number.isInteger(Number(cantidad_minima)) || Number(cantidad_minima) < 0) {
            errores.push("El stock mínimo debe ser un número entero mayor o igual a 0.");
        }
    }

    // 8. Validación de Regla de Negocio: Cantidad vs Stock Mínimo
    // Solo comparamos si ambos valores están presentes en la petición o si uno viene y el otro ya existe
    if (cantidad !== undefined && cantidad_minima !== undefined) {
        if (Number(cantidad) < Number(cantidad_minima)) {
            errores.push(`La cantidad actual (${cantidad}) no puede ser menor al stock mínimo establecido (${cantidad_minima}).`);
        }
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de inventario inválidos",
            detalles: errores
        });
    }

    next();
};

module.exports = { validarInventario };