const { esUUID } = require('../utils/validadores');

const validarInventario = (req, res, next) => {
    const { nombre, codigo, categoria_id, cantidad_disponible, cantidad_total, cantidad_danada, stock_minimo } = req.body;
    const errores = [];
    const esCreacion = !req.params || !req.params.id;

    if (esCreacion && (!nombre || nombre.trim() === "")) {
        errores.push("El nombre del artículo es obligatorio.");
    } else if (nombre && nombre.length > 150) {
        errores.push("El nombre no puede exceder los 150 caracteres.");
    }

    if (codigo && codigo.length > 50) {
        errores.push("El código no puede exceder los 50 caracteres.");
    }

    if (categoria_id && !esUUID(categoria_id)) {
        errores.push("El ID de categoría no es un UUID válido.");
    }

    if (cantidad_total !== undefined && cantidad_total !== null) {
        if (!Number.isInteger(Number(cantidad_total)) || Number(cantidad_total) < 0) {
            errores.push("La cantidad total debe ser un número entero mayor o igual a 0.");
        }
    }
    if (cantidad_disponible !== undefined && cantidad_disponible !== null) {
        if (!Number.isInteger(Number(cantidad_disponible)) || Number(cantidad_disponible) < 0) {
            errores.push("La cantidad disponible debe ser un número entero mayor o igual a 0.");
        }
    }
    if (cantidad_danada !== undefined && cantidad_danada !== null) {
        if (!Number.isInteger(Number(cantidad_danada)) || Number(cantidad_danada) < 0) {
            errores.push("La cantidad dañada debe ser un número entero mayor o igual a 0.");
        }
    }
    if (stock_minimo !== undefined && stock_minimo !== null) {
        if (!Number.isInteger(Number(stock_minimo)) || Number(stock_minimo) < 0) {
            errores.push("El stock mínimo debe ser un número entero mayor o igual a 0.");
        }
    }

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
