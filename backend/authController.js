const { prisma } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        const { usuario, contrasena } = req.body;

        try {
            // 1. Buscar el usuario
            const user = await prisma.usuario.findUnique({
                where: { usuario },
                include: {
                    rol: true
                }
            });

            if (!user) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            // 2. Verificar si está activo
            if (!user.activo) {
                return res.status(403).json({ error: "El usuario está desactivado" });
            }

            // 3. Comparar contraseña
            const match = await bcrypt.compare(contrasena, user.contrasena);
            if (!match) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            // 4. Generar Token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    usuario: user.usuario, 
                    rol_id: user.rol_id 
                },
                process.env.JWT_SECRET || 'clave_secreta_por_defecto',
                { expiresIn: '8h' }
            );

            // 5. Responder con los datos (sin la contraseña)
            const { contrasena: _, ...datosUsuario } = user;
            res.json({
                mensaje: "Login exitoso",
                token,
                usuario: datosUsuario
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error en el proceso de login" });
        }
    }
};

module.exports = authController;
