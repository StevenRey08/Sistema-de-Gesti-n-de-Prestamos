const { prisma } = require('../db');

const dashboardController = {
    getStats: async (req, res) => {
        try {
            // Ejecutamos varias consultas en paralelo para velocidad
            const [
                totalArticulos,
                totalCategorias,
                totalPersonas,
                prestamosActivos,
                movimientosRecientes
            ] = await Promise.all([
                prisma.inventario.count(),
                prisma.categoriaHerramienta.count(),
                prisma.persona.count(),
                prisma.prestamo.count({ where: { estado: 'ACTIVO' } }),
                prisma.movimiento.findMany({
                    take: 5,
                    orderBy: { fecha: 'desc' },
                    include: {
                        inventario: { select: { nombre: true } },
                        usuario: { select: { usuario: true } }
                    }
                })
            ]);

            // Obtener alertas de stock (cantidad <= cantidad_minima)
            const inventario = await prisma.inventario.findMany({
                select: { cantidad: true, cantidad_minima: true }
            });
            const alertasStock = inventario.filter(i => i.cantidad <= i.cantidad_minima).length;

            res.json({
                counts: {
                    articulos: totalArticulos,
                    categorias: totalCategorias,
                    personas: totalPersonas,
                    prestamos_activos: prestamosActivos,
                    alertas_stock: alertasStock
                },
                movimientos_recientes: movimientosRecientes
            });
        } catch (error) {
            console.error("Error en dashboardController:", error);
            res.status(500).json({ error: "Error al obtener estadísticas del dashboard" });
        }
    }
};

module.exports = dashboardController;
