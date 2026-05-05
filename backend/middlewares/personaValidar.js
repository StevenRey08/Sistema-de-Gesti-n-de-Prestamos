const { esEmail, esTelefono, esCedula, esMatricula } = require('../utils/validadores');

const validarPersona = (req, res, next) => {
    const { nombres, apellidos, email, telefono, numero_documento, tipo_documento, tipo } = req.body;
    const errores = [];

    // 1. Validar Nombres y Apellidos
    if (!nombres || nombres.trim() === "") errores.push("El nombre es obligatorio.");
    if (!apellidos || apellidos.trim() === "") errores.push("El apellido es obligatorio.");

    // 2. Validar Email
    if (!email || email.trim() === "") {
        errores.push("El correo electrónico es obligatorio.");
    } else if (!esEmail(email)) {
        errores.push("El formato del correo electrónico no es válido.");
    }


    if (!tipo || tipo.trim() === "") {
        errores.push("El tipo es obligatorio.");
    }

    // 3. Validar Tipo de Documento (Permitir Cédula y Matrícula)
    const tiposPermitidos = ["Cédula", "Matrícula", "Cedula", "Matricula"];

    if (!tipo_documento || tipo_documento.trim() === "") {
        errores.push("El tipo de documento es obligatorio.");
    } else if (!tiposPermitidos.some(t => t.toLowerCase() === tipo_documento.toLowerCase())) {
        errores.push("Tipo de documento no válido. Use 'Cédula' o 'Matrícula'.");
    }

    // 4. Validar Número de Documento según el Tipo seleccionado
    if (!numero_documento || numero_documento.trim() === "") {
        errores.push("El número de documento es obligatorio.");
    } else if (tipo_documento) {
        const tipoLogico = tipo_documento.toLowerCase();

        // Si es Cédula
        if (tipoLogico.includes("cedula")) {
            if (!esCedula(numero_documento)) {
                errores.push("La cédula debe tener el formato: 000-0000000-0.");
            }
        }
        // Si es Matrícula
        else if (tipoLogico.includes("matricula")) {
            if (!esMatricula(numero_documento)) {
                errores.push("La matrícula debe tener el formato: 0000-0000.");
            }
        }
    }

    // 5. Validar Teléfono
    if (telefono && !esTelefono(telefono)) {
        errores.push("El teléfono debe tener el formato: 000-000-0000.");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de persona inválidos",
            detalles: errores
        });
    }

    next();
};

module.exports = { validarPersona };