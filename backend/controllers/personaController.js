const { prisma } = require('../db');
const logger = require('../utils/logger');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const personaController = {
    // Listar y buscar por nombre, apellido o documento
    getAll: async (req, res) => {
        const { search } = req.query;
        try {
            const personas = await prisma.persona.findMany({
                where: search ? {
                    OR: [
                        { nombres: { contains: search, mode: 'insensitive' } },
                        { apellidos: { contains: search, mode: 'insensitive' } },
                        { numero_documento: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                orderBy: { nombres: 'asc' }
            });
            res.json(personas);
        } catch (error) {
            logger.error("Error en personas.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener personas" });
        }
    },

    // Crear persona
    create: async (req, res) => {
        try {
            const nueva = await prisma.persona.create({ data: req.body });
            res.status(201).json(nueva);
        } catch (error) {
            logger.error("Error en personas.create:", error);
            const duplicateError = buildUniqueConstraintError(error, {
                numero_documento: "Ya existe una persona registrada con ese número de documento.",
            }, "Ya existe un registro de persona con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear persona" });
        }
    },

    // Obtener una por ID
    getById: async (req, res) => {
        try {
            const persona = await prisma.persona.findUnique({ where: { id: req.params.id } });
            if (!persona) return res.status(404).json({ status: "error", mensaje: "Persona no encontrada" });
            res.json(persona);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar persona" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const actualizada = await prisma.persona.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizada);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                numero_documento: "Ya existe una persona registrada con ese número de documento.",
            }, "Ya existe un registro de persona con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.persona.delete({ where: { id: req.params.id } });
            res.json({ message: "Persona eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar (puede que tenga préstamos asociados)" });
        }
    }
};

module.exports = personaController;
