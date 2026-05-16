const { prisma } = require('../db'); // Usando tu misma importación de prisma
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

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
            res.status(500).json({ status: "error", mensaje: "Error al obtener categorías" });
        }
    },

    // Crear categoría
    create: async (req, res) => {
        try {
            const { nombre } = req.body;
            if (nombre) {
                const existe = await prisma.categoriaHerramienta.findFirst({
                    where: { nombre: { equals: nombre, mode: 'insensitive' } }
                });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "Ya existe una categoría con ese nombre (sin diferenciar mayúsculas/minúsculas)." });
                }
            }
            const nueva = await prisma.categoriaHerramienta.create({ data: req.body });
            res.status(201).json(nueva);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                nombre: "Ya existe una categoría registrada con ese nombre.",
            }, "Ya existe una categoría con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear la categoría" });
        }
    },

    // Obtener una por ID
    getById: async (req, res) => {
        try {
            const categoria = await prisma.categoriaHerramienta.findUnique({
                where: { id: req.params.id }
            });
            if (!categoria) return res.status(404).json({ status: "error", mensaje: "Categoría no encontrada" });
            res.json(categoria);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar la categoría" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const { nombre } = req.body;
            if (nombre) {
                const existe = await prisma.categoriaHerramienta.findFirst({
                    where: {
                        nombre: { equals: nombre, mode: 'insensitive' },
                        id: { not: req.params.id }
                    }
                });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "Ya existe una categoría con ese nombre (sin diferenciar mayúsculas/minúsculas)." });
                }
            }
            const actualizada = await prisma.categoriaHerramienta.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizada);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                nombre: "Ya existe una categoría registrada con ese nombre.",
            }, "Ya existe una categoría con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.categoriaHerramienta.delete({ where: { id: req.params.id } });
            res.json({ message: "Categoría eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar (puede que tenga inventario asociado)" });
        }
    }
};

module.exports = categoriaController;
