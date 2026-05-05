const { esCedula, esMatricula, esUUID } = require('../utils/validadores');

const validarUsuario = (req, res, next) => {
    const { nombre, apellido, usuario, contrasena, rol_id, tipo_documento, numero_documento, activo } = req.body;
    const errores = [];

    // 1. Validar Nombre y Apellido
    if (!nombre || nombre.trim() === "") errores.push("El nombre es obligatorio.");
    if (!apellido || apellido.trim() === "") errores.push("El apellido es obligatorio.");

    // 2. Validar Username (usuario)
    if (!usuario || usuario.trim() === "") {
        errores.push("El nombre de usuario es obligatorio.");
    } else if (usuario.length < 4) {
        errores.push("El nombre de usuario debe tener al menos 4 caracteres.");
    }

    // 3. Validar Contraseña (Solo obligatoria en creación)
    // Nota: Si es un PUT, a veces la contraseña no se envía si no se va a cambiar.
    if (req.method === 'POST') {
        if (!contrasena || contrasena.length < 6) {
            errores.push("La contraseña es obligatoria y debe tener al menos 6 caracteres.");
        }
    }

    // 4. Validar Rol (UUID)
    if (rol_id && !esUUID(rol_id)) {
        errores.push("El rol_id debe ser un UUID válido.");
    }

    // 5. Validar Documentos (Reutilizando tu lógica de Persona)
    const tiposPermitidos = ["Cédula", "Matrícula", "Cedula", "Matricula"];
    if (tipo_documento || numero_documento) {
        if (!tiposPermitidos.some(t => t.toLowerCase() === tipo_documento?.toLowerCase())) {
            errores.push("Tipo de documento no válido. Use 'Cédula' o 'Matrícula'.");
        }

        if (tipo_documento?.toLowerCase().includes("cedula")) {
            if (!esCedula(numero_documento)) errores.push("Formato de cédula inválido (000-0000000-0).");
        } else if (tipo_documento?.toLowerCase().includes("matricula")) {
            if (!esMatricula(numero_documento)) errores.push("Formato de matrícula inválido (0000-0000).");
        }
    }

    // 6. Validar campo Activo (Boolean)
    if (activo !== undefined && typeof activo !== 'boolean') {
        errores.push("El campo 'activo' debe ser verdadero o falso.");
    }

    // --- RESPUESTA ---
    if (errores.length > 0) {
        return res.status(400).json({
            status: "error",
            mensaje: "Datos de usuario inválidos",
            detalles: errores
        });
    }

    next();
};

module.exports = { validarUsuario };