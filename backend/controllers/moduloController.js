const { prisma } = require('../db');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');

const moduloController = {
    getAll: async (req, res) => {
        const { search } = req.query;
        try {
            const modulos = await prisma.modulo.findMany({
                where: search ? {
                    OR: [
                        { nombre: { contains: search, mode: 'insensitive' } },
                        { descripcion: { contains: search, mode: 'insensitive' } },
                    ]
                } : {},
                include: {
                    _count: {
                        select: { permisos: true }
                    }
                },
                orderBy: { orden: 'asc' }
            });
            res.json(modulos);
        } catch (error) {
            console.error('Error al obtener módulos:', error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener módulos" });
        }
    },

    create: async (req, res) => {
        try {
            const { nombre, descripcion, ruta, icono, orden } = req.body;
            
            const nuevo = await prisma.modulo.create({
                data: {
                    nombre: nombre.toUpperCase(),
                    descripcion: descripcion || null,
                    ruta: ruta || null,
                    icono: icono || null,
                    orden: orden || 0,
                }
            });
            res.status(201).json(nuevo);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                modulos_nombre_key: "Ya existe un módulo con ese nombre.",
            }, "Ya existe un módulo con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            console.error('Error al crear módulo:', error);
            res.status(500).json({ status: "error", mensaje: "Error al crear el módulo" });
        }
    },

    getById: async (req, res) => {
        try {
            const modulo = await prisma.modulo.findUnique({
                where: { id: req.params.id },
                include: {
                    permisos: { include: { rol: true } }
                }
            });
            if (!modulo) return res.status(404).json({ status: "error", mensaje: "Módulo no encontrado" });
            res.json(modulo);
        } catch (error) {
            console.error('Error al buscar módulo:', error);
            res.status(500).json({ status: "error", mensaje: "Error al buscar el módulo" });
        }
    },

    update: async (req, res) => {
        try {
            const data = { ...req.body };
            
            if (data.nombre) {
                data.nombre = data.nombre.toUpperCase();
            }

            const actualizado = await prisma.modulo.update({
                where: { id: req.params.id },
                data
            });
            res.json(actualizado);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                modulos_nombre_key: "Ya existe un módulo con ese nombre.",
            }, "Ya existe un módulo con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            console.error('Error al actualizar módulo:', error);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar el módulo" });
        }
    },

    delete: async (req, res) => {
        try {
            const modulo = await prisma.modulo.findUnique({
                where: { id: req.params.id },
                include: { _count: { select: { permisos: true } } }
            });

            if (!modulo) {
                return res.status(404).json({ status: "error", mensaje: "Módulo no encontrado" });
            }

            if (modulo._count.permisos > 0) {
                return res.status(400).json({ 
                    status: "error", 
                    mensaje: "No se puede eliminar el módulo porque tiene permisos asociados. Elimina primero los permisos." 
                });
            }

            await prisma.modulo.delete({ where: { id: req.params.id } });
            res.json({ message: "Módulo eliminado correctamente" });
        } catch (error) {
            console.error('Error al eliminar módulo:', error);
            res.status(500).json({ status: "error", mensaje: "Error al eliminar el módulo" });
        }
    },

    seedDefaultModules: async (req, res) => {
        try {
            const defaultModules = [
                { nombre: 'INVENTARIO', descripcion: 'Gestión de inventario y herramientas', ruta: '/inventario', icono: 'tool', orden: 1 },
                { nombre: 'PERSONAS', descripcion: 'Gestión de personas (estudiantes, instructores)', ruta: '/personas', icono: 'users', orden: 2 },
                { nombre: 'PRESTAMOS', descripcion: 'Gestión de préstamos y devoluciones', ruta: '/prestamos', icono: 'handshake', orden: 3 },
                { nombre: 'MOVIMIENTOS', descripcion: 'Historial de movimientos de inventario', ruta: '/movimientos', icono: 'arrow-right-arrow-left', orden: 4 },
                { nombre: 'PEDIDOS', descripcion: 'Gestión de pedidos y abastecimiento', ruta: '/pedidos', icono: 'shopping-cart', orden: 5 },
                { nombre: 'UBICACIONES', descripcion: 'Gestión de ubicaciones físicas', ruta: '/ubicaciones', icono: 'map-pin', orden: 6 },
                { nombre: 'CATEGORIAS', descripcion: 'Categorías de herramientas', ruta: '/categorias', icono: 'folder', orden: 7 },
                { nombre: 'USUARIOS', descripcion: 'Gestión de usuarios del sistema', ruta: '/seguridad', icono: 'shield', orden: 8 },
                { nombre: 'REPORTES', descripcion: 'Reportes y estadísticas', ruta: '/reportes', icono: 'chart-bar', orden: 9 },
                { nombre: 'DASHBOARD', descripcion: 'Panel principal', ruta: '/', icono: 'home', orden: 0 },
            ];

            const created = [];
            for (const mod of defaultModules) {
                const exists = await prisma.modulo.findUnique({ where: { nombre: mod.nombre } });
                if (!exists) {
                    const nuevo = await prisma.modulo.create({ data: mod });
                    created.push(nuevo);
                }
            }

            res.json({ message: `Módulos creados: ${created.length}`, data: created });
        } catch (error) {
            console.error('Error al crear módulos por defecto:', error);
            res.status(500).json({ status: "error", mensaje: "Error al crear módulos por defecto" });
        }
    }
};

module.exports = moduloController;
