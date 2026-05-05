const { prisma } = require('../db');

const permisoController = {
    // Listar todos los permisos (con opción de filtrar por rol)
    getAll: async (req, res) => {
        const { rol_id } = req.query;
        try {
            const permisos = await prisma.permiso.findMany({
                where: rol_id ? { rol_id: rol_id } : {},
                include: {
                    rol: true,
                    modulo: true
                }
            });
            res.json(permisos);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener permisos" });
        }
    },

    // Crear o asignar permiso
    create: async (req, res) => {
        try {
            const nuevo = await prisma.permiso.create({ data: req.body });
            res.status(201).json(nuevo);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "Este rol ya tiene permisos asignados a este módulo" });
            }
            res.status(500).json({ error: "Error al crear el permiso" });
        }
    },

    // Obtener uno por ID
    getById: async (req, res) => {
        try {
            const permiso = await prisma.permiso.findUnique({
                where: { id: req.params.id },
                include: { rol: true, modulo: true }
            });
            if (!permiso) return res.status(404).json({ error: "Permiso no encontrado" });
            res.json(permiso);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el permiso" });
        }
    },

    // Actualizar (ej: cambiar de false a true un permiso)
    update: async (req, res) => {
        try {
            const actualizado = await prisma.permiso.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizado);
        } catch (error) {
            res.status(500).json({ error: "Error al actualizar el permiso" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.permiso.delete({ where: { id: req.params.id } });
            res.json({ message: "Permiso eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar el permiso" });
        }
    }
};

module.exports = permisoController;