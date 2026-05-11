const { prisma } = require('../db'); // Importamos prisma para consultar la DB
const { esEmail, esTelefono, esCedula, esMatricula } = require('../utils/validadores');

const validarPersona = async (req, res, next) => {
    const { nombres, apellidos, email, telefono, numero_documento, tipo_documento, tipo } = req.body;
    const personaId = req.params.id; // Para casos de actualización (PUT)
    const errores = [];

    // 1. Validar Nombres y Apellidos
    if (!nombres?.trim()) errores.push("El nombre es obligatorio.");
    if (!apellidos?.trim()) errores.push("El apellido es obligatorio.");

    // 2. Validar Email
    if (!email?.trim()) {
        errores.push("El correo electrónico es obligatorio.");
    } else if (!esEmail(email)) {
        errores.push("El formato del correo electrónico no es válido.");
    }

    if (!tipo?.trim()) {
        errores.push("El tipo es obligatorio.");
    }

    // 3. Validar Tipo de Documento
    const tiposPermitidos = ["Cédula", "Matrícula", "Cedula", "Matricula"];
    if (!tipo_documento?.trim()) {
        errores.push("El tipo de documento es obligatorio.");
    } else if (!tiposPermitidos.some(t => t.toLowerCase() === tipo_documento.toLowerCase())) {
        errores.push("Tipo de documento no válido. Use 'Cédula' o 'Matrícula'.");
    }

    // 4. Validar Número de Documento (Formato y Duplicidad)
    if (!numero_documento?.trim()) {
        errores.push("El número de documento es obligatorio.");
    } else {
        // --- VALIDACIÓN DE FORMATO ---
        const tipoLogico = tipo_documento
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        if (tipoLogico.includes("cedula") && !esCedula(numero_documento)) {
            errores.push("La cédula debe tener el formato: 000-0000000-0.");
        } else if (tipoLogico.includes("matricula") && !esMatricula(numero_documento)) {
            errores.push("La matrícula debe tener el formato: 0000-0000.");
        }

        // --- VALIDACIÓN DE DUPLICIDAD (DB) ---
        try {
            const existePersona = await prisma.persona.findUnique({
                where: { numero_documento: numero_documento }
            });

            // Si existe y no es la misma persona que estamos editando
            if (existePersona && existePersona.id !== personaId) {
                errores.push(`El número de documento '${numero_documento}' ya está registrado en el sistema.`);
            }
        } catch (error) {
            return res.status(500).json({ status: "error", mensaje: "Error al validar documento en el sistema" });
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