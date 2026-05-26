const { prisma } = require('../db');
const logger = require('../utils/logger');

async function marcarVencidos() {
    try {
        await prisma.prestamo.updateMany({
            where: {
                estado: 'PENDIENTE',
                fecha_devolucion: { lt: new Date(Date.now() - 60000) },
            },
            data: { estado: 'VENCIDO' }
        });
    } catch (error) {
        logger.error('Error al marcar préstamos vencidos:', error);
    }
}

const dashboardController = {
    getStats: async (req, res) => {
        try {
            await marcarVencidos();

            const [
                totalArticulos,
                totalCategorias,
                totalPersonas,
                prestamosActivos,
                prestamosPendientes,
                movimientosRecientes
            ] = await Promise.all([
                prisma.inventario.count(),
                prisma.categoriaHerramienta.count(),
                prisma.persona.count(),
                prisma.prestamo.count({ where: { estado: 'VENCIDO' } }),
                prisma.prestamo.count({ where: { estado: 'PENDIENTE' } }),
                prisma.movimiento.findMany({
                    take: 5,
                    orderBy: { fecha: 'desc' },
                    include: {
                        inventario: { select: { nombre: true } },
                        usuario: { select: { usuario: true } }
                    }
                })
            ]);

            res.json({
                counts: {
                    articulos: totalArticulos,
                    categorias: totalCategorias,
                    personas: totalPersonas,
                    prestamos_activos: prestamosActivos,
                    prestamos_pendientes: prestamosPendientes
                },
                movimientos_recientes: movimientosRecientes
            });
        } catch (error) {
            logger.error("Error en dashboardController:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener estadísticas del dashboard" });
        }
    }
};

module.exports = dashboardController;
