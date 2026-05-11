const { prisma } = require('../db');
const bcrypt = require('bcrypt');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

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
            res.status(500).json({ status: "error", mensaje: "Error al obtener usuarios" });
        }
    },

    // Crear usuario
    create: async (req, res) => {
        try {
            const data = { ...req.body };
            
            // Hashear la contraseña si existe
            if (data.contrasena) {
                const salt = await bcrypt.genSalt(12);
                data.contrasena = await bcrypt.hash(data.contrasena, salt);
            }

            const nuevo = await prisma.usuario.create({ data });
            
            // No devolver la contraseña en la respuesta
            const { contrasena, ...usuarioSinPass } = nuevo;
            res.status(201).json(usuarioSinPass);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                usuario: "Ya existe un usuario registrado con ese nombre de usuario.",
                numero_documento: "Ya existe un usuario registrado con ese número de documento.",
            }, "Ya existe un usuario con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear usuario" });
        }
    },

    // Obtener por ID
    getById: async (req, res) => {
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { id: req.params.id },
                include: { rol: true }
            });
            if (!usuario) return res.status(404).json({ status: "error", mensaje: "Usuario no encontrado" });
            res.json(usuario);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar usuario" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const data = { ...req.body };

            // Si se envía una nueva contraseña, la hasheamos
            if (data.contrasena) {
                const salt = await bcrypt.genSalt(12);
                data.contrasena = await bcrypt.hash(data.contrasena, salt);
            }

            const actualizado = await prisma.usuario.update({
                where: { id: req.params.id },
                data: data
            });

            const { contrasena, ...usuarioSinPass } = actualizado;
            res.json(usuarioSinPass);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                usuario: "Ya existe un usuario registrado con ese nombre de usuario.",
                numero_documento: "Ya existe un usuario registrado con ese número de documento.",
            }, "Ya existe un usuario con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar usuario" });
        }
    },

    // Eliminar (Borrado físico)
    delete: async (req, res) => {
        try {
            await prisma.usuario.delete({ where: { id: req.params.id } });
            res.json({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar usuario (puede tener registros asociados)" });
        }
    }
};

module.exports = usuarioController;
