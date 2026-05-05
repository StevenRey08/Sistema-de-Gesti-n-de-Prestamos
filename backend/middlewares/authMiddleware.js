const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // El token suele venir como "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado: No se proporcionó un token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_por_defecto');
        req.usuario = decoded; // Guardamos los datos del usuario en la request
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
};

module.exports = {
    verificarToken
};
