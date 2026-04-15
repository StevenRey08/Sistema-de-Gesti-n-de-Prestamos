const { prisma } = require('../db'); // Usando tu misma importación de prisma

const categoriaController = {
    // Listar y buscar por nombre de categoría
    getAll: async (req, res) => {
        const { search } = req.query;
        try {
            const categorias = await prisma.categoriaHerramienta.findMany({
                where: search ? {
                    nombre: { contains: search, mode: 'insensitive' }
                } : {},
                orderBy: { nombre: 'asc' }
            });
            res.json(categorias);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener categorías" });
        }
    },

    // Crear categoría
    create: async (req, res) => {
        try {
            const nueva = await prisma.categoriaHerramienta.create({ data: req.body });
            res.status(201).json(nueva);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "El nombre de esta categoría ya existe" });
            }
            res.status(500).json({ error: "Error al crear la categoría" });
        }
    },

    // Obtener una por ID
    getById: async (req, res) => {
        try {
            const categoria = await prisma.categoriaHerramienta.findUnique({
                where: { id: req.params.id }
            });
            if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
            res.json(categoria);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar la categoría" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const actualizada = await prisma.categoriaHerramienta.update({
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
            await prisma.categoriaHerramienta.delete({ where: { id: req.params.id } });
            res.json({ message: "Categoría eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar (puede que tenga inventario asociado)" });
        }
    }
};

module.exports = categoriaController;