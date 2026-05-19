const { prisma } = require('../db');

const logAuditoria = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            const originalJson = res.json;
            
            res.json = function(data) {
                const logData = {
                    usuario_id: req.usuario?.id || null,
                    accion,
                    modulo,
                    descripcion: `${accion} en ${modulo}`,
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent') || null,
                    detalles: {
                        method: req.method,
                        url: req.originalUrl,
                        params: req.params,
                        query: req.query,
                        statusCode: res.statusCode,
                    }
                };

                prisma.auditoriaLog.create({ data: logData }).catch(err => {
                    console.error('Error al registrar log de auditoría:', err);
                });

                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en middleware de auditoría:', error);
            next();
        }
    };
};

const logAuditoriaDetalle = (modulo, accion, getDescripcion) => {
    return async (req, res, next) => {
        try {
            const originalJson = res.json;
            
            res.json = function(data) {
                const descripcion = getDescripcion ? getDescripcion(req, data) : `${accion} en ${modulo}`;
                
                const logData = {
                    usuario_id: req.usuario?.id || null,
                    accion,
                    modulo,
                    descripcion,
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.get('User-Agent') || null,
                    detalles: {
                        method: req.method,
                        url: req.originalUrl,
                        params: req.params,
                        query: req.query,
                        statusCode: res.statusCode,
                    }
                };

                prisma.auditoriaLog.create({ data: logData }).catch(err => {
                    console.error('Error al registrar log de auditoría:', err);
                });

                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Error en middleware de auditoría:', error);
            next();
        }
    };
};

module.exports = { logAuditoria, logAuditoriaDetalle };
