const { prisma } = require('../db');
const { generarCodigoAleatorio } = require('../utils/generadores');

const inventarioController = {
    // Listar artículos con búsqueda por nombre/código y filtros
    getAll: async (req, res) => {
        const { search, categoria, ubicacion } = req.query;
        try {
            const items = await prisma.inventario.findMany({
                where: {
                    AND: [
                        categoria ? { categoria_id: categoria } : {},
                        ubicacion ? { ubicacion_id: ubicacion } : {},
                        search ? {
                            OR: [
                                { nombre: { contains: search, mode: 'insensitive' } },
                                { codigo: { contains: search, mode: 'insensitive' } }
                            ]
                        } : {}
                    ]
                },
                include: {
                    categoria: true,
                    ubicacion: {
                        include: { padre: true } // Para saber en qué estante está la caja, por ejemplo
                    }
                },
                orderBy: { nombre: 'asc' }
            });
            res.json(items);
        } catch (error) {
            console.error("Error en inventario.getAll:", error);
            res.status(500).json({ error: "Error al obtener el inventario" });
        }
    },

    getAlertasStock: async (req, res) => {
        try {
            // Buscamos productos donde la cantidad sea menor o igual al stock_minimo
            // Nota: Prisma no permite comparar dos columnas directamente en 'where' de forma nativa 
            // fácilmente sin 'queryRaw', por lo que usamos un filtro tras la consulta:
            const inventarioCompleto = await prisma.inventario.findMany({
                include: { categoria: true, ubicacion: true }
            });

            const alertas = inventarioCompleto.filter(item =>
                item.cantidad <= item.cantidad_minima
            );

            res.json({
                total_alertas: alertas.length,
                articulos: alertas
            });
        } catch (error) {
            console.error("Error al obtener alertas:", error);
            res.status(500).json({ error: "Error al generar reporte de alertas" });
        }
    },
    // Crear artículo con generación de código automática
    create: async (req, res) => {
        try {
            let data = req.body;

            // Manejar subida de imagen
            if (req.file) {
                data.imagen_ruta = req.file.path.replace(/\\/g, '/'); // Normalizar ruta para web
            }

            // Generar código automático si no se proporciona
            if (!data.codigo || data.codigo.trim() === "") {
                let codigoGenerado;
                let existe = true;

                while (existe) {
                    // Usamos INV como prefijo por defecto para Inventario
                    codigoGenerado = generarCodigoAleatorio("INV");
                    const duplicado = await prisma.inventario.findUnique({
                        where: { codigo: codigoGenerado }
                    });
                    if (!duplicado) existe = false;
                }
                data.codigo = codigoGenerado;
            }

            // Asegurar que cantidad sea un entero
            if (data.cantidad) data.cantidad = parseInt(data.cantidad);

            const nuevo = await prisma.inventario.create({
                data,
                include: { ubicacion: true, categoria: true }
            });

            res.status(201).json(nuevo);
        } catch (error) {
            console.error("Error en inventario.create:", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "El código de inventario ya existe" });
            }
            res.status(500).json({ error: "Error al crear el artículo" });
        }
    },

    // Obtener un artículo por ID con detalle de ubicación e historial reciente
    getById: async (req, res) => {
        try {
            const item = await prisma.inventario.findUnique({
                where: { id: req.params.id },
                include: {
                    categoria: true,
                    ubicacion: {
                        include: { padre: true }
                    },
                    movimientos: {
                        take: 10,
                        orderBy: { fecha: 'desc' } // Según tu modelo Movimiento: 'fecha'
                    }
                }
            });
            if (!item) return res.status(404).json({ error: "Artículo no encontrado" });
            res.json(item);
        } catch (error) {
            console.error("Error en inventario.getById:", error);
            res.status(500).json({ error: "Error al buscar el artículo" });
        }
    },

    // Actualizar artículo
    update: async (req, res) => {
        try {
            const data = req.body;

            // Manejar subida de imagen
            if (req.file) {
                data.imagen_ruta = req.file.path.replace(/\\/g, '/');
            }

            if (data.cantidad) data.cantidad = parseInt(data.cantidad);

            const actualizado = await prisma.inventario.update({
                where: { id: req.params.id },
                data: data
            });
            res.json(actualizado);
        } catch (error) {
            console.error("Error en inventario.update:", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "El código ya está en uso por otro artículo" });
            }
            res.status(500).json({ error: "Error al actualizar el artículo" });
        }
    },

    // Eliminar artículo
    delete: async (req, res) => {
        try {
            await prisma.inventario.delete({ where: { id: req.params.id } });
            res.json({ message: "Artículo eliminado correctamente" });
        } catch (error) {
            console.error("Error en inventario.delete:", error);
            // Error de restricción de llave foránea (si tiene préstamos o movimientos)
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: "No se puede eliminar: el artículo tiene historial de movimientos o préstamos asociados."
                });
            }
            res.status(500).json({ error: "Error al eliminar el artículo" });
        }
    }
};

module.exports = inventarioController;