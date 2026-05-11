function ok(res, datos, mensaje = "Operación exitosa") {
    return res.json({ status: "ok", mensaje, datos });
}

function created(res, datos, mensaje = "Creado correctamente") {
    return res.status(201).json({ status: "ok", mensaje, datos });
}

function error(res, mensaje, status = 500, detalles = []) {
    const body = { status: "error", mensaje };
    if (detalles.length > 0) body.detalles = detalles;
    return res.status(status).json(body);
}

function badRequest(res, mensaje, detalles = []) {
    return error(res, mensaje, 400, detalles);
}

function notFound(res, mensaje = "Recurso no encontrado") {
    return error(res, mensaje, 404);
}

function unauthorized(res, mensaje = "No autorizado") {
    return error(res, mensaje, 401);
}

function forbidden(res, mensaje = "Acceso denegado") {
    return error(res, mensaje, 403);
}


function pick(data, fields) {
    const result = {};
    for (const field of fields) {
        if (data[field] !== undefined) {
            result[field] = data[field];
        }
    }
    return result;
}

module.exports = { ok, created, error, badRequest, notFound, unauthorized, forbidden, pick };
