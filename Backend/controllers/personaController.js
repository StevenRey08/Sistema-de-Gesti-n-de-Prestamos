const { prisma } = require('../db');

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
            res.status(500).json({ error: "Error al obtener personas" });
        }
    },

    // Crear persona
    create: async (req, res) => {
        try {
            const nueva = await prisma.persona.create({ data: req.body });
            res.status(201).json(nueva);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "El número de documento ya existe" });
            }
            res.status(500).json({ error: "Error al crear persona" });
        }
    },

    // Obtener una por ID
    getById: async (req, res) => {
        try {
            const persona = await prisma.persona.findUnique({ where: { id: req.params.id } });
            if (!persona) return res.status(404).json({ error: "Persona no encontrada" });
            res.json(persona);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar persona" });
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
            res.status(500).json({ error: "Error al actualizar" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.persona.delete({ where: { id: req.params.id } });
            res.json({ message: "Persona eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar (puede que tenga préstamos asociados)" });
        }
    }
};

module.exports = personaController;