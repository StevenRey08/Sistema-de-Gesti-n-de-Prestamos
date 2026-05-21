const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const verificarToken = async (req, res, next) => {
    let token = req.cookies?.sgp_token;

    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ status: "error", mensaje: "Acceso denegado: No se proporcionó un token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const sesion = await prisma.sesion.findUnique({ where: { token } });
        if (!sesion || !sesion.activa) {
            return res.status(401).json({ status: "error", mensaje: "Sesión inválida o cerrada" });
        }
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ status: "error", mensaje: "Token inválido o expirado" });
    }
};

module.exports = {
    verificarToken
};
