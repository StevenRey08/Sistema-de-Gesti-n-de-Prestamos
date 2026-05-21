const { prisma } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { getMaxIntentosFallidos, getDuracionBloqueo, getTimeoutSesionHoras, validarPasswordConPoliticas } = require('../utils/politicasSeguridad');

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
                await prisma.auditoriaLog.create({
                    data: {
                        accion: 'LOGIN_FALLIDO',
                        modulo: 'AUTENTICACION',
                        descripcion: `Intento de login con usuario inexistente: ${usuario}`,
                        ip: req.ip || req.socket.remoteAddress,
                        user_agent: req.get('User-Agent'),
                        detalles: { usuario }
                    }
                });
                return res.status(401).json({ status: "error", mensaje: "Credenciales inválidas" });
            }

            if (!user.activo) {
                await prisma.auditoriaLog.create({
                    data: {
                        usuario_id: user.id,
                        accion: 'LOGIN_FALLIDO',
                        modulo: 'AUTENTICACION',
                        descripcion: `Intento de login con usuario desactivado: ${usuario}`,
                        ip: req.ip || req.socket.remoteAddress,
                        user_agent: req.get('User-Agent'),
                        detalles: { usuario_id: user.id }
                    }
                });
                return res.status(403).json({ status: "error", mensaje: "El usuario está desactivado" });
            }

            if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
                await prisma.auditoriaLog.create({
                    data: {
                        usuario_id: user.id,
                        accion: 'LOGIN_FALLIDO',
                        modulo: 'AUTENTICACION',
                        descripcion: `Intento de login con usuario bloqueado: ${usuario}`,
                        ip: req.ip || req.socket.remoteAddress,
                        user_agent: req.get('User-Agent'),
                        detalles: { usuario_id: user.id, bloqueado_hasta: user.bloqueado_hasta }
                    }
                });
                return res.status(403).json({ status: "error", mensaje: `Usuario bloqueado hasta ${user.bloqueado_hasta.toLocaleString()}` });
            }

            const match = await bcrypt.compare(contrasena, user.contrasena);
            if (!match) {
                const nuevosIntentos = user.intentos_fallidos + 1;
                const maxIntentos = await getMaxIntentosFallidos();
                let bloqueadoHasta = null;
                
                if (nuevosIntentos >= maxIntentos) {
                    const lockoutMinutes = await getDuracionBloqueo();
                    bloqueadoHasta = new Date(Date.now() + lockoutMinutes * 60 * 1000);
                }

                await prisma.usuario.update({
                    where: { id: user.id },
                    data: {
                        intentos_fallidos: nuevosIntentos,
                        bloqueado_hasta: bloqueadoHasta
                    }
                });

                await prisma.auditoriaLog.create({
                    data: {
                        usuario_id: user.id,
                        accion: 'LOGIN_FALLIDO',
                        modulo: 'AUTENTICACION',
                        descripcion: `Contraseña incorrecta para ${usuario}. Intento ${nuevosIntentos}`,
                        ip: req.ip || req.socket.remoteAddress,
                        user_agent: req.get('User-Agent'),
                        detalles: { usuario_id: user.id, intento: nuevosIntentos, bloqueado: !!bloqueadoHasta }
                    }
                });

                const lockoutDuration = await getDuracionBloqueo();
                return res.status(401).json({ 
                    status: "error", 
                    mensaje: bloqueadoHasta 
                        ? `Usuario bloqueado por ${lockoutDuration} minutos`
                        : "Credenciales inválidas" 
                });
            }

            await prisma.usuario.update({
                where: { id: user.id },
                data: {
                    intentos_fallidos: 0,
                    bloqueado_hasta: null,
                    ultimo_acceso: new Date()
                }
            });

            const timeoutHoras = await getTimeoutSesionHoras();
            const token = jwt.sign(
                { id: user.id, usuario: user.usuario, rol_id: user.rol_id },
                process.env.JWT_SECRET,
                { expiresIn: `${timeoutHoras}h` }
            );

            res.cookie('sgp_token', token, {
                ...COOKIE_OPTIONS,
                maxAge: timeoutHoras * 60 * 60 * 1000
            });

            const sesionActiva = await prisma.sesion.findFirst({ where: { activa: true } });
            if (sesionActiva) {
                return res.status(409).json({ status: "error", mensaje: "Ya hay una sesión activa en el sistema. Cierre esa sesión antes de iniciar una nueva." });
            }

            await prisma.sesion.create({
                data: {
                    usuario_id: user.id,
                    token,
                    ip: req.ip || req.socket.remoteAddress,
                    user_agent: req.get('User-Agent')
                }
            });

            await prisma.auditoriaLog.create({
                data: {
                    usuario_id: user.id,
                    accion: 'LOGIN',
                    modulo: 'AUTENTICACION',
                    descripcion: `Inicio de sesión exitoso: ${usuario}`,
                    ip: req.ip || req.socket.remoteAddress,
                    user_agent: req.get('User-Agent'),
                    detalles: { usuario_id: user.id }
                }
            });

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
        try {
            if (req.usuario) {
                await prisma.sesion.updateMany({
                    where: {
                        usuario_id: req.usuario.id,
                        activa: true
                    },
                    data: {
                        activa: false,
                        fecha_logout: new Date()
                    }
                });

                await prisma.auditoriaLog.create({
                    data: {
                        usuario_id: req.usuario.id,
                        accion: 'LOGOUT',
                        modulo: 'AUTENTICACION',
                        descripcion: `Cierre de sesión: ${req.usuario.usuario}`,
                        ip: req.ip || req.socket.remoteAddress,
                        user_agent: req.get('User-Agent'),
                        detalles: { usuario_id: req.usuario.id }
                    }
                });
            }
        } catch (error) {
            logger.error("Error al registrar logout:", error);
        }
        
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

            if (!contrasena_actual) {
                return res.status(400).json({ status: "error", mensaje: "Debe ingresar su contraseña actual para confirmar los cambios." });
            }
            const match = await bcrypt.compare(contrasena_actual, currentUser.contrasena);
            if (!match) {
                return res.status(400).json({ status: "error", mensaje: "La contraseña actual no es correcta." });
            }

            if (contrasena) {
                if (contrasena_actual === contrasena && contrasena === confirmar_contrasena) {
                    return res.status(400).json({ status: "error", mensaje: "La nueva contraseña no puede ser igual a la actual. Por seguridad, elige una contraseña diferente." });
                }
                if (contrasena !== confirmar_contrasena) {
                    return res.status(400).json({ status: "error", mensaje: "Las contraseñas nuevas no coinciden." });
                }
                const erroresPassword = await validarPasswordConPoliticas(contrasena);
                if (erroresPassword.length > 0) {
                    return res.status(400).json({ status: "error", mensaje: "La contraseña no cumple con las políticas de seguridad", detalles: erroresPassword });
                }
            }

            if (usuario && usuario !== currentUser.usuario) {
                const existe = await prisma.usuario.findUnique({ where: { usuario } });
                if (existe) {
                    return res.status(400).json({ status: "error", mensaje: "El nombre de usuario ya está en uso" });
                }
            }

            if (email && email !== currentUser.email) {
                const existe = await prisma.usuario.findFirst({ where: { email } });
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
            const user = await prisma.usuario.findFirst({ where: { email } });
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

            const erroresPassword = await validarPasswordConPoliticas(nueva_contrasena);
            if (erroresPassword.length > 0) {
                return res.status(400).json({ status: "error", mensaje: "La contraseña no cumple con las políticas de seguridad", detalles: erroresPassword });
            }

            const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
            await prisma.usuario.updateMany({
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
