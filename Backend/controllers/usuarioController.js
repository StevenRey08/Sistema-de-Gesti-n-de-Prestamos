const { prisma } = require('../db');

const usuarioController = {
    // Listar y buscar usuarios
    getAll: async (req, res) => {
        const { search } = req.query;
        try {
            const usuarios = await prisma.usuario.findMany({
                where: search ? {
                    OR: [
                        { nombre: { contains: search, mode: 'insensitive' } },
                        { apellido: { contains: search, mode: 'insensitive' } },
                        { usuario: { contains: search, mode: 'insensitive' } },
                        { numero_documento: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                include: {
                    rol: true // Incluye los datos del rol asignado
                },
                orderBy: { nombre: 'asc' }
            });
            res.json(usuarios);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener usuarios" });
        }
    },

    // Crear usuario
    create: async (req, res) => {
        try {
            const nuevo = await prisma.usuario.create({ data: req.body });
            res.status(201).json(nuevo);
        } catch (error) {
            if (error.code === 'P2002') {
                const target = error.meta.target;
                if (target.includes('usuario')) {
                    return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
                }
                if (target.includes('numero_documento')) {
                    return res.status(400).json({ error: "El número de documento ya existe" });
                }
            }
            res.status(500).json({ error: "Error al crear usuario" });
        }
    },

    // Obtener por ID
    getById: async (req, res) => {
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { id: req.params.id },
                include: { rol: true }
            });
            if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
            res.json(usuario);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar usuario" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const actualizado = await prisma.usuario.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizado);
        } catch (error) {
            res.status(500).json({ error: "Error al actualizar usuario" });
        }
    },

    // Eliminar (Borrado físico)
    delete: async (req, res) => {
        try {
            await prisma.usuario.delete({ where: { id: req.params.id } });
            res.json({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar usuario (puede tener registros asociados)" });
        }
    }
};

module.exports = usuarioController;