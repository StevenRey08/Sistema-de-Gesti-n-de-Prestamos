const { prisma } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
};

const authController = {
    login: async (req, res) => {
        const { usuario, contrasena } = req.body;

        try {
            const user = await prisma.usuario.findUnique({
                where: { usuario },
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: {
                                    modulo: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return res.status(401).json({ status: "error", mensaje: "Credenciales inválidas" });
            }

            if (!user.activo) {
                return res.status(403).json({ status: "error", mensaje: "El usuario está desactivado" });
            }

            const match = await bcrypt.compare(contrasena, user.contrasena);
            if (!match) {
                return res.status(401).json({ status: "error", mensaje: "Credenciales inválidas" });
            }

            const token = jwt.sign(
                { id: user.id, usuario: user.usuario, rol_id: user.rol_id },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Set httpOnly cookie (seguro contra XSS)
            res.cookie('sgp_token', token, COOKIE_OPTIONS);

            const { contrasena: _, ...datosUsuario } = user;
            res.json({
                mensaje: "Login exitoso",
                token,
                usuario: datosUsuario
            });

        } catch (error) {
            logger.error("Error en login", { error: error.message });
            res.status(500).json({ status: "error", mensaje: "Error en el proceso de login" });
        }
    },

    logout: async (req, res) => {
        res.clearCookie('sgp_token', { path: '/' });
        res.json({ status: "ok", mensaje: "Sesión cerrada" });
    },

    me: async (req, res) => {
        try {
            const user = await prisma.usuario.findUnique({
                where: { id: req.usuario.id },
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: {
                                    modulo: true
                                }
                            }
                        }
                    }
                }
            });
            if (!user) {
                return res.status(401).json({ status: "error", mensaje: "Usuario no encontrado" });
            }
            const { contrasena: _, ...datosUsuario } = user;
            res.json({ status: "ok", usuario: datosUsuario });
        } catch (error) {
            logger.error("Error en me", { error: error.message });
            res.status(500).json({ status: "error", mensaje: "Error al verificar sesión" });
        }
    },

    actualizarPerfil: async (req, res) => {
        const { nombre, apellido, usuario, contrasena } = req.body;

        try {
            const currentUser = await prisma.usuario.findUnique({
                where: { id: req.usuario.id }
            });

            if (!currentUser) {
                return res.status(401).json({ status: "error", mensaje: "Usuario no encontrado" });
            }

            if (usuario && usuario !== currentUser.usuario) {
                const existe = await prisma.usuario.findUnique({ where: { usuario } });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "El nombre de usuario ya está en uso" });
                }
            }

            const data = {};
            if (nombre !== undefined) data.nombre = nombre;
            if (apellido !== undefined) data.apellido = apellido;
            if (usuario !== undefined) data.usuario = usuario;
            if (contrasena) {
                data.contrasena = await bcrypt.hash(contrasena, 10);
            }

            const updatedUser = await prisma.usuario.update({
                where: { id: req.usuario.id },
                data,
                include: {
                    rol: {
                        include: {
                            permisos: {
                                include: {
                                    modulo: true
                                }
                            }
                        }
                    }
                }
            });

            const { contrasena: _, ...datosUsuario } = updatedUser;
            res.json({ status: "ok", usuario: datosUsuario });
        } catch (error) {
            logger.error("Error al actualizar perfil", { error: error.message });
            res.status(500).json({ status: "error", mensaje: "Error al actualizar perfil" });
        }
    }
};

module.exports = authController;
