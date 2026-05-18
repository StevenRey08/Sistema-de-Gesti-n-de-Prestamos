const { prisma } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
};

const resetCodes = new Map();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

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
                                include: { modulo: true }
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
                                include: { modulo: true }
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
        const { nombre, apellido, usuario, email, contrasena, contrasena_actual, confirmar_contrasena } = req.body;

        try {
            const currentUser = await prisma.usuario.findUnique({
                where: { id: req.usuario.id }
            });

            if (!currentUser) {
                return res.status(401).json({ status: "error", mensaje: "Usuario no encontrado" });
            }

            if (contrasena) {
                if (!contrasena_actual) {
                    return res.status(400).json({ status: "error", mensaje: "Debe ingresar su contraseña actual para cambiarla." });
                }
                const match = await bcrypt.compare(contrasena_actual, currentUser.contrasena);
                if (!match) {
                    return res.status(400).json({ status: "error", mensaje: "La contraseña actual no es correcta." });
                }
                if (contrasena_actual === contrasena && contrasena === confirmar_contrasena) {
                    return res.status(400).json({ status: "error", mensaje: "La nueva contraseña no puede ser igual a la actual. Por seguridad, elige una contraseña diferente." });
                }
                if (contrasena !== confirmar_contrasena) {
                    return res.status(400).json({ status: "error", mensaje: "Las contraseñas nuevas no coinciden." });
                }
            }

            if (usuario && usuario !== currentUser.usuario) {
                const existe = await prisma.usuario.findUnique({ where: { usuario } });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "El nombre de usuario ya está en uso" });
                }
            }

            if (email && email !== currentUser.email) {
                const existe = await prisma.usuario.findUnique({ where: { email } });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "El correo electrónico ya está en uso" });
                }
            }

            const data = {};
            if (nombre !== undefined) data.nombre = nombre;
            if (apellido !== undefined) data.apellido = apellido;
            if (usuario !== undefined) data.usuario = usuario;
            if (email !== undefined) data.email = email || null;
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
                                include: { modulo: true }
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
    },

    solicitarCodigoReset: async (req, res) => {
        const { email } = req.body;

        try {
            const user = await prisma.usuario.findUnique({ where: { email } });
            if (!user) {
                return res.status(404).json({ status: "error", mensaje: "No existe una cuenta con ese correo electrónico." });
            }

            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            resetCodes.set(email, { codigo, expiry: Date.now() + 15 * 60 * 1000 });

            try {
                await transporter.sendMail({
                    from: `"Sistema Inventario" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: 'Código de recuperación de contraseña',
                    html: `
                        <h2>Recuperación de contraseña</h2>
                        <p>Has solicitado restablecer tu contraseña.</p>
                        <p>Tu código de verificación es:</p>
                        <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${codigo}</h1>
                        <p>Este código expira en 15 minutos.</p>
                        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
                    `
                });
                res.json({ status: "ok", mensaje: "Código enviado al correo electrónico." });
            } catch (mailError) {
                resetCodes.delete(email);
                logger.error("Error al enviar email:", mailError);
                res.status(500).json({ status: "error", mensaje: "Error al enviar el correo. Verifique la configuración SMTP." });
            }
        } catch (error) {
            logger.error("Error en solicitarCodigoReset:", error);
            res.status(500).json({ status: "error", mensaje: "Error al procesar la solicitud." });
        }
    },

    verificarCodigoReset: async (req, res) => {
        const { email, codigo } = req.body;

        try {
            const stored = resetCodes.get(email);
            if (!stored) {
                return res.status(400).json({ status: "error", mensaje: "No se ha solicitado un código para este correo." });
            }
            if (Date.now() > stored.expiry) {
                resetCodes.delete(email);
                return res.status(400).json({ status: "error", mensaje: "El código ha expirado. Solicite uno nuevo." });
            }
            if (stored.codigo !== codigo) {
                return res.status(400).json({ status: "error", mensaje: "El código ingresado no es correcto." });
            }

            res.json({ status: "ok", mensaje: "Código verificado correctamente.", email });
        } catch (error) {
            logger.error("Error en verificarCodigoReset:", error);
            res.status(500).json({ status: "error", mensaje: "Error al verificar el código." });
        }
    },

    resetPassword: async (req, res) => {
        const { email, codigo, nueva_contrasena } = req.body;

        try {
            const stored = resetCodes.get(email);
            if (!stored) {
                return res.status(400).json({ status: "error", mensaje: "No se ha solicitado un código para este correo." });
            }
            if (Date.now() > stored.expiry) {
                resetCodes.delete(email);
                return res.status(400).json({ status: "error", mensaje: "El código ha expirado." });
            }
            if (stored.codigo !== codigo) {
                return res.status(400).json({ status: "error", mensaje: "El código ingresado no es correcto." });
            }

            const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
            await prisma.usuario.update({
                where: { email },
                data: { contrasena: hashedPassword }
            });

            resetCodes.delete(email);
            res.json({ status: "ok", mensaje: "Contraseña actualizada correctamente." });
        } catch (error) {
            logger.error("Error en resetPassword:", error);
            res.status(500).json({ status: "error", mensaje: "Error al restablecer la contraseña." });
        }
    }
};

module.exports = authController;
