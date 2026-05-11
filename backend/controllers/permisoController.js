const { prisma } = require('../db');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

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
            res.status(500).json({ status: "error", mensaje: "Error al obtener permisos" });
        }
    },

    // Crear o asignar permiso
    create: async (req, res) => {
        try {
            const nuevo = await prisma.permiso.create({ data: req.body });
            res.status(201).json(nuevo);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                permisos_rol_id_modulo_id_key: "Este rol ya tiene un permiso asignado para ese módulo.",
            }, "Ya existe un permiso registrado para esa combinación de rol y módulo.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear el permiso" });
        }
    },

    // Obtener uno por ID
    getById: async (req, res) => {
        try {
            const permiso = await prisma.permiso.findUnique({
                where: { id: req.params.id },
                include: { rol: true, modulo: true }
            });
            if (!permiso) return res.status(404).json({ status: "error", mensaje: "Permiso no encontrado" });
            res.json(permiso);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar el permiso" });
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
            const duplicateError = buildUniqueConstraintError(error, {
                permisos_rol_id_modulo_id_key: "Este rol ya tiene un permiso asignado para ese módulo.",
            }, "Ya existe un permiso registrado para esa combinación de rol y módulo.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar el permiso" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.permiso.delete({ where: { id: req.params.id } });
            res.json({ message: "Permiso eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar el permiso" });
        }
    }
};

module.exports = permisoController;
