const { prisma } = require('../db');
const logger = require('../utils/logger');
const { generarCodigoAleatorio } = require('../utils/generadores');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const ubicacionController = {
    // Listar ubicaciones con búsqueda y filtro de tipo
    getAll: async (req, res) => {
        const { search, tipo } = req.query;
        try {
            const ubicaciones = await prisma.ubicacion.findMany({
                where: {
                    AND: [
                        tipo ? { tipo: tipo.toUpperCase() } : {}, // Filtro por tipo (CAJA, ESTANTE, etc)
                        search ? {
                            OR: [
                                { nombre: { contains: search, mode: 'insensitive' } },
                                { codigo: { contains: search, mode: 'insensitive' } }
                            ]
                        } : {}
                    ]
                },
                include: {
                    padre: true,           // Ver dónde está ubicada esta caja/estante
                    sub_ubicaciones: true  // Ver qué tiene dentro (si es un estante)
                },
                orderBy: { nombre: 'asc' }
            });
            res.json(ubicaciones);
        } catch (error) {
            logger.error("Error en ubicaciones.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener las ubicaciones" });
        }
    },

    // Crear ubicación (con código automático basado en el tipo)
    create: async (req, res) => {
        try {
            let data = req.body;

            // Generar código automático si no viene (Usa las primeras 3 letras del tipo como prefijo)
            if (!data.codigo || data.codigo.trim() === "") {
                const prefijo = data.tipo ? data.tipo.substring(0, 3) : "UBI";
                let codigoGenerado;
                let existe = true;

                // Intentar hasta encontrar un código que no esté en la base de datos
                while (existe) {
                    codigoGenerado = generarCodigoAleatorio(prefijo);
                    const duplicado = await prisma.ubicacion.findUnique({
                        where: { codigo: codigoGenerado }
                    });
                    if (!duplicado) {
                        existe = false;
                    }
                }
                data.codigo = codigoGenerado;
            }

            const nueva = await prisma.ubicacion.create({ data });
            res.status(201).json(nueva);
        } catch (error) {
            logger.error("Error en ubicaciones.create:", error);
            const duplicateError = buildUniqueConstraintError(error, {
                codigo: "Ya existe una ubicación registrada con ese código.",
            }, "Ya existe una ubicación con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear la ubicación" });
        }
    },

    // Obtener una por ID con toda su jerarquía e inventario
    getById: async (req, res) => {
        try {
            const ubicacion = await prisma.ubicacion.findUnique({
                where: { id: req.params.id },
                include: {
                    padre: true,
                    sub_ubicaciones: true,
                    inventarios: true // Ver qué herramientas hay exactamente aquí
                }
            });
            if (!ubicacion) return res.status(404).json({ status: "error", mensaje: "Ubicación no encontrada" });
            res.json(ubicacion);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar la ubicación" });
        }
    },

    // Actualizar
    update: async (req, res) => {
        try {
            const actualizada = await prisma.ubicacion.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizada);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                codigo: "Ya existe una ubicación registrada con ese código.",
            }, "Ya existe una ubicación con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar la ubicación" });
        }
    },

    // Eliminar
    delete: async (req, res) => {
        try {
            await prisma.ubicacion.delete({ where: { id: req.params.id } });
            res.json({ message: "Ubicación eliminada correctamente" });
        } catch (error) {
            // El error P2003 ocurre si tiene hijos (sub_ubicaciones) o herramientas
            res.status(500).json({
                error: "No se puede eliminar: la ubicación tiene herramientas o sub-ubicaciones (cajas/estuches) asociadas."
            });
        }
    }
};

module.exports = ubicacionController;
