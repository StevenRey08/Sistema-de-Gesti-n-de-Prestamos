const { prisma } = require('../db');

const movimientoController = {
    // ... (getAll se mantiene igual)
    getAll: async (req, res) => {
        const { tipo, inventario_id, persona_id } = req.query;
        try {
            const movimientos = await prisma.movimiento.findMany({
                where: {
                    AND: [
                        tipo ? { tipo: tipo.toUpperCase() } : {},
                        inventario_id ? { inventario_id } : {},
                        persona_id ? { persona_id } : {}
                    ]
                },
                include: {
                    inventario: true,
                    ubicacion_origen: true,
                    ubicacion_destino: true,
                    persona: true,
                    usuario: { select: { usuario: true } }
                },
                orderBy: { fecha: 'desc' }
            });
            res.json(movimientos);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener historial" });
        }
    },

    create: async (req, res) => {
        const {
            inventario_id,
            tipo,
            cantidad,
            ubicacion_destino_id,
            ubicacion_origen_id,
            persona_id,
            usuario_id,
            observaciones
        } = req.body;

        const cantMovimiento = parseInt(cantidad);
        const tipoUpper = tipo.toUpperCase();

        try {
            const resultado = await prisma.$transaction(async (tx) => {
                // 1. Obtener el artículo actual para validar stock
                const articulo = await tx.inventario.findUnique({
                    where: { id: inventario_id }
                });

                if (!articulo) throw new Error("El producto no existe en el inventario.");

                // 2. Lógica de cálculo de stock
                let nuevaCantidad = articulo.cantidad;

                if (tipoUpper === 'ENTRADA') {
                    nuevaCantidad += cantMovimiento;
                }
                else if (tipoUpper === 'SALIDA' || tipoUpper === 'PRESTAMO') {
                    if (articulo.cantidad < cantMovimiento) {
                        throw new Error(`Stock insuficiente. Disponible: ${articulo.cantidad}`);
                    }
                    nuevaCantidad -= cantMovimiento;
                }
                // Nota: En TRASLADO la cantidad total no cambia, solo la ubicación.

                // 3. Crear el registro del movimiento
                const nuevoMovimiento = await tx.movimiento.create({
                    data: {
                        inventario_id,
                        tipo: tipoUpper,
                        cantidad: cantMovimiento,
                        ubicacion_origen_id: ubicacion_origen_id || articulo.ubicacion_id,
                        ubicacion_destino_id,
                        persona_id,
                        usuario_id,
                        observaciones
                    }
                });

                // 4. Actualizar el Inventario (Stock y Ubicación si aplica)
                const updateData = { cantidad: nuevaCantidad };

                // Si es traslado o entrada con destino, actualizamos ubicación
                if ((tipoUpper === 'TRASLADO' || tipoUpper === 'ENTRADA') && ubicacion_destino_id) {
                    updateData.ubicacion_id = ubicacion_destino_id;
                }

                await tx.inventario.update({
                    where: { id: inventario_id },
                    data: updateData
                });

                return nuevoMovimiento;
            });

            res.status(201).json(resultado);
        } catch (error) {
            console.error("Error en movimientos.create:", error);
            res.status(400).json({
                error: error.message || "Error al procesar el movimiento"
            });
        }
    },

    // ... (getById y delete se mantienen igual)
    getById: async (req, res) => {
        try {
            const movimiento = await prisma.movimiento.findUnique({
                where: { id: req.params.id },
                include: {
                    inventario: true,
                    ubicacion_origen: true,
                    ubicacion_destino: true,
                    persona: true
                }
            });
            if (!movimiento) return res.status(404).json({ error: "No encontrado" });
            res.json(movimiento);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar" });
        }
    },

    delete: async (req, res) => {
        try {
            await prisma.movimiento.delete({ where: { id: req.params.id } });
            res.json({ message: "Eliminado" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar" });
        }
    }
};

module.exports = movimientoController;