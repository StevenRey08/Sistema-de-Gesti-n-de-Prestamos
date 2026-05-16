const { prisma } = require('../db');
const { esMatricula } = require('../utils/validadores');

const validarPersona = async (req, res, next) => {
    const { nombres, apellidos, matricula, tipo, curso, telefono } = req.body;
    const personaId = req.params.id;
    const errores = [];

    if (!nombres?.trim()) errores.push("El nombre es obligatorio.");
    if (!apellidos?.trim()) errores.push("El apellido es obligatorio.");

    if (!tipo?.trim()) {
        errores.push("El tipo es obligatorio.");
    }

    if (!matricula?.trim()) {
        errores.push("La matrícula es obligatoria.");
    } else {
        if (!esMatricula(matricula)) {
            errores.push("La matrícula debe tener el formato: 0000-0000.");
        }
        try {
            const existePersona = await prisma.persona.findUnique({
                where: { matricula }
            });
            if (existePersona && existePersona.id !== personaId) {
                errores.push(`La matrícula '${matricula}' ya está registrada en el sistema.`);
            }
        } catch (error) {
            return res.status(500).json({ status: "error", mensaje: "Error al validar matrícula en el sistema" });
        }
    }

    if (telefono && telefono.length > 0) {
        const telRegex = /^\d{3}-\d{3}-\d{4}$/;
        if (!telRegex.test(telefono)) {
            errores.push("El teléfono debe tener el formato: 000-000-0000.");
        }
    }

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
