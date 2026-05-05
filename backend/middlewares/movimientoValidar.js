const { esUUID } = require('../utils/validadores');

const validarMovimiento = (req, res, next) => {
    const {
        inventario_id,
        tipo,
        cantidad,
        usuario_id,
        ubicacion_destino_id,
        persona_id
    } = req.body;

    const errores = [];

    // 1. Validaciones base
    if (!inventario_id || !esUUID(inventario_id)) errores.push("El campo inventario_id es obligatorio y debe ser UUID.");
    if (!usuario_id || !esUUID(usuario_id)) errores.push("El campo usuario_id (quien registra) es obligatorio.");

    // Validar que cantidad sea un número entero y mayor a 0
    if (cantidad === undefined || isNaN(cantidad) || parseInt(cantidad) <= 0) {
        errores.push("La cantidad debe ser un número entero mayor a cero.");
    }

    // 2. Validar tipo de movimiento
    const tiposPermitidos = ['ENTRADA', 'SALIDA', 'TRASLADO', 'PRESTAMO'];
    const tipoUpper = tipo?.toUpperCase();

    if (!tipo || !tiposPermitidos.includes(tipoUpper)) {
        errores.push(`El tipo de movimiento debe ser uno de: ${tiposPermitidos.join(', ')}.`);
    }

    // 3. Validaciones condicionales (Lógica de Negocio)
    // Si es TRASLADO o ENTRADA, suele ser obligatorio saber a dónde va
    if ((tipoUpper === 'TRASLADO' || tipoUpper === 'ENTRADA') && !ubicacion_destino_id) {
        errores.push("Para entradas o traslados, la ubicacion_destino_id es obligatoria.");
    }

    // Si es PRESTAMO, es obligatorio saber a quién se le entrega
    if (tipoUpper === 'PRESTAMO' && (!persona_id || !esUUID(persona_id))) {
        errores.push("Para préstamos, la persona_id es obligatoria.");
    }

    // Validar formato de UUIDs opcionales si vienen en el body
    if (ubicacion_destino_id && !esUUID(ubicacion_destino_id)) errores.push("Formato de ubicacion_destino_id inválido.");
    if (persona_id && !esUUID(persona_id)) errores.push("Formato de persona_id inválido.");

    // --- RESPUESTA ---
    if (errores.length > 0) {
        // Cambiamos a 400: Error del cliente por enviar datos mal formados
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de movimiento incompletos o inválidos",
            detalles: errores
        });
    }

    next();
};

module.exports = { validarMovimiento };