const { prisma } = require('../db');

const proveedorController = {
    // 1. Obtener todos (con búsqueda opcional)
    getAll: async (req, res) => {
        const { search } = req.query; // Capturamos el parámetro de búsqueda ?search=valor
        try {
            const proveedores = await prisma.proveedor.findMany({
                where: search ? {
                    OR: [
                        { nombre_empresa: { contains: search, mode: 'insensitive' } },
                        { nombre_contacto: { contains: search, mode: 'insensitive' } }
                    ]
                } : {},
                orderBy: { nombre_empresa: 'asc' }
            });
            res.json(proveedores);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener proveedores" });
        }
    },

    // 2. Crear
    create: async (req, res) => {
        try {
            const nuevo = await prisma.proveedor.create({ data: req.body });
            res.status(201).json(nuevo);
        } catch (error) {
            if (error.code === 'P2002') return res.status(400).json({ error: "El código ya existe" });
            res.status(500).json({ error: "Error al crear" });
        }
    },

    // 3. Obtener uno por ID
    getById: async (req, res) => {
        try {
            const proveedor = await prisma.proveedor.findUnique({ where: { id: req.params.id } });
            if (!proveedor) return res.status(404).json({ error: "No encontrado" });
            res.json(proveedor);
        } catch (error) {
            res.status(500).json({ error: "Error al buscar" });
        }
    },

    // 4. Actualizar
    update: async (req, res) => {
        try {
            const actualizado = await prisma.proveedor.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizado);
        } catch (error) {
            res.status(500).json({ error: "Error al actualizar" });
        }
    },

    // 5. Eliminar
    delete: async (req, res) => {
        try {
            await prisma.proveedor.delete({ where: { id: req.params.id } });
            res.json({ message: "Proveedor eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ error: "Error al eliminar (puede que tenga inventario asociado)" });
        }
    }
};

module.exports = proveedorController;
