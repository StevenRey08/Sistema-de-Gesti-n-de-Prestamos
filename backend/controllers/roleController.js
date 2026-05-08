const { prisma } = require('../db');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const roleController = {
    // Listar y buscar por nombre de rol
    getAll: async (req, res) => {
        const { search } = req.query;
        try {
            const roles = await prisma.role.findMany({
                where: search ? {
                    nombre_rol: { contains: search, mode: 'insensitive' }
                } : {},
                orderBy: { nombre_rol: 'asc' }
            });
            res.json(roles);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener roles" });
        }
    },

    // Crear rol
    create: async (req, res) => {
        try {
            const nuevo = await prisma.role.create({ data: req.body });
            res.status(201).json(nuevo);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                nombre_rol: "Ya existe un rol registrado con ese nombre.",
            }, "Ya existe un rol con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ error: "Error al crear el rol" });
        }
    },

    // Obtener uno por ID
    getById: async (req, res) => {
        try {
            const role = await prisma.role.findUnique({ where: { id: req.params.id } });
            if (!role) return res.status(404).json({ error: "Rol no encontrado" });
            res.json(role);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el rol" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const actualizado = await prisma.role.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizado);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                nombre_rol: "Ya existe un rol registrado con ese nombre.",
            }, "Ya existe un rol con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ error: "Error al actualizar" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.role.delete({ where: { id: req.params.id } });
            res.json({ message: "Rol eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar (puede que tenga usuarios o permisos asociados)" });
        }
    }
};

module.exports = roleController;
