const { prisma } = require('../db');
const logger = require('../utils/logger');

const TABLES_TO_CLEAR = [
  'detalles_pedidos',
  'pedidos',
  'movimientos',
  'prestamos',
  'inventario',
  'categorias_herramientas',
  'ubicaciones',
  'personas',
];

const seedController = {
  reset: async (req, res) => {
    try {
      await prisma.$transaction(async (tx) => {
        for (const table of TABLES_TO_CLEAR) {
          await tx.$executeRawUnsafe(`DELETE FROM "${table}" CASCADE`);
        }
      });
      logger.info('Base de datos limpiada (excepto usuarios/roles/permisos/modulos)');
      res.json({ status: 'success', mensaje: 'Datos limpiados exitosamente. Roles, usuarios y permisos preservados.' });
    } catch (error) {
      logger.error('Error al limpiar datos:', error);
      res.status(500).json({ status: 'error', mensaje: 'Error al limpiar datos', detalles: [error.message] });
    }
  },

  seed: async (req, res) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const instructor = await tx.persona.create({
          data: {
            matricula: 'PROF-001',
            nombres: 'Carlos',
            apellidos: 'Mendoza',
            tipo: 'Profesor',
            curso: 'Electrónica General'
          }
        });

        const instructor2 = await tx.persona.create({
          data: {
            matricula: 'PROF-002',
            nombres: 'María',
            apellidos: 'Fernández',
            tipo: 'Profesor',
            curso: 'Mecánica Industrial'
          }
        });

        const estudiantes = await Promise.all([
          tx.persona.create({ data: { matricula: '2020-1001', nombres: 'Juan', apellidos: 'Pérez', tipo: 'Estudiante', curso: 'Electrónica General' } }),
          tx.persona.create({ data: { matricula: '2020-1002', nombres: 'Ana', apellidos: 'García', tipo: 'Estudiante', curso: 'Electrónica General' } }),
          tx.persona.create({ data: { matricula: '2020-1003', nombres: 'Luis', apellidos: 'Rodríguez', tipo: 'Estudiante', curso: 'Mecánica Industrial' } }),
          tx.persona.create({ data: { matricula: '2020-1004', nombres: 'Carmen', apellidos: 'Martínez', tipo: 'Estudiante', curso: 'Mecánica Industrial' } }),
          tx.persona.create({ data: { matricula: '2020-1005', nombres: 'Pedro', apellidos: 'Sánchez', tipo: 'Estudiante', curso: 'Electrónica General' } }),
        ]);

        const ubicaciones = await Promise.all([
          tx.ubicacion.create({ data: { codigo: 'EST-01', nombre: 'Estante A1', tipo: 'Estante', descripcion: 'Estante principal lado izquierdo' } }),
          tx.ubicacion.create({ data: { codigo: 'EST-02', nombre: 'Estante A2', tipo: 'Estante', descripcion: 'Estante principal lado derecho' } }),
          tx.ubicacion.create({ data: { codigo: 'CAJ-01', nombre: 'Caja de herramientas #1', tipo: 'Caja', descripcion: 'Caja plástica grande' } }),
          tx.ubicacion.create({ data: { codigo: 'CAJ-02', nombre: 'Caja de herramientas #2', tipo: 'Caja', descripcion: 'Caja plástica mediana' } }),
          tx.ubicacion.create({ data: { codigo: 'EST-03', nombre: 'Estante B1', tipo: 'Estante', descripcion: 'Estante posterior' } }),
        ]);

        const categorias = await Promise.all([
          tx.categoriaHerramienta.create({ data: { nombre: 'Medición', descripcion: 'Instrumentos de medición', ubicacion_id: ubicaciones[0].id } }),
          tx.categoriaHerramienta.create({ data: { nombre: 'Corte', descripcion: 'Herramientas de corte', ubicacion_id: ubicaciones[1].id } }),
          tx.categoriaHerramienta.create({ data: { nombre: 'Sujeción', descripcion: 'Herramientas de sujeción y presión', ubicacion_id: ubicaciones[2].id } }),
          tx.categoriaHerramienta.create({ data: { nombre: 'Eléctrica', descripcion: 'Herramientas eléctricas y electrónicas', ubicacion_id: ubicaciones[3].id } }),
          tx.categoriaHerramienta.create({ data: { nombre: 'Seguridad', descripcion: 'Equipos de protección personal', ubicacion_id: ubicaciones[4].id } }),
        ]);

        const herramientas = [
          { codigo: 'MULT-001', nombre: 'Multímetro Digital', categoria_id: categorias[0].id, cantidad_total: 15, cantidad_disponible: 12, stock_minimo: 3 },
          { codigo: 'OSC-001', nombre: 'Osciloscopio', categoria_id: categorias[0].id, cantidad_total: 5, cantidad_disponible: 4, stock_minimo: 1 },
          { codigo: 'CAL-001', nombre: 'Calibrador Vernier', categoria_id: categorias[0].id, cantidad_total: 20, cantidad_disponible: 18, stock_minimo: 5 },
          { codigo: 'PIN-001', nombre: 'Pinzas de Corte', categoria_id: categorias[1].id, cantidad_total: 25, cantidad_disponible: 22, stock_minimo: 5 },
          { codigo: 'COR-001', nombre: 'Cortador Lateral', categoria_id: categorias[1].id, cantidad_total: 20, cantidad_disponible: 19, stock_minimo: 4 },
          { codigo: 'SIE-001', nombre: 'Sierra para Metal', categoria_id: categorias[1].id, cantidad_total: 10, cantidad_disponible: 9, stock_minimo: 2 },
          { codigo: 'TOR-001', nombre: 'Juego de Destornilladores', categoria_id: categorias[2].id, cantidad_total: 15, cantidad_disponible: 14, stock_minimo: 3 },
          { codigo: 'LLA-001', nombre: 'Llave Inglesa', categoria_id: categorias[2].id, cantidad_total: 10, cantidad_disponible: 10, stock_minimo: 2 },
          { codigo: 'PRE-001', nombre: 'Prensa de Mesa', categoria_id: categorias[2].id, cantidad_total: 3, cantidad_disponible: 3, stock_minimo: 1 },
          { codigo: 'SOL-001', nombre: 'Cautín de Soldar', categoria_id: categorias[3].id, cantidad_total: 12, cantidad_disponible: 10, stock_minimo: 3 },
          { codigo: 'PRO-001', nombre: 'Protoboard', categoria_id: categorias[3].id, cantidad_total: 20, cantidad_disponible: 18, stock_minimo: 5 },
          { codigo: 'FUE-001', nombre: 'Fuente de Poder Variable', categoria_id: categorias[3].id, cantidad_total: 6, cantidad_disponible: 5, stock_minimo: 2 },
          { codigo: 'CAS-001', nombre: 'Casco de Seguridad', categoria_id: categorias[4].id, cantidad_total: 20, cantidad_disponible: 20, stock_minimo: 5 },
          { codigo: 'GAF-001', nombre: 'Gafas de Protección', categoria_id: categorias[4].id, cantidad_total: 30, cantidad_disponible: 28, stock_minimo: 10 },
          { codigo: 'GUA-001', nombre: 'Guantes de Trabajo', categoria_id: categorias[4].id, cantidad_total: 25, cantidad_disponible: 23, stock_minimo: 8 },
          { codigo: 'PIN-002', nombre: 'Pinzas de Punta', categoria_id: categorias[1].id, cantidad_total: 18, cantidad_disponible: 16, stock_minimo: 4 },
          { codigo: 'DES-001', nombre: 'Desoldador', categoria_id: categorias[3].id, cantidad_total: 8, cantidad_disponible: 7, stock_minimo: 2 },
          { codigo: 'LIM-001', nombre: 'Lima Plana', categoria_id: categorias[1].id, cantidad_total: 15, cantidad_disponible: 14, stock_minimo: 3 },
        ];

        const inventario = await Promise.all(
          herramientas.map((h) => tx.inventario.create({ data: h }))
        );

        await Promise.all([
          // Préstamo activo
          tx.prestamo.create({
            data: {
              inventario_id: inventario[0].id,
              persona_id: estudiantes[0].id,
              instructor_id: instructor.id,
              cantidad: 1,
              fecha_devolucion: new Date(Date.now() + 7 * 86400000), // +7 días
              estado: 'ACTIVO',
              observaciones: 'Préstamo para prácticas de laboratorio'
            }
          }),
          // Préstamo vencido
          tx.prestamo.create({
            data: {
              inventario_id: inventario[3].id,
              persona_id: estudiantes[1].id,
              instructor_id: instructor.id,
              cantidad: 2,
              fecha_devolucion: new Date(Date.now() - 3 * 86400000), // -3 días (vencido)
              estado: 'ACTIVO',
              observaciones: 'Préstamo vencido - no ha sido devuelto'
            }
          }),
          // Préstamo devuelto
          tx.prestamo.create({
            data: {
              inventario_id: inventario[6].id,
              persona_id: estudiantes[2].id,
              instructor_id: instructor2.id,
              cantidad: 1,
              fecha_prestamo: new Date(Date.now() - 14 * 86400000),
              fecha_devolucion: new Date(Date.now() - 10 * 86400000),
              estado: 'DEVUELTO',
              observaciones: 'DEV: Devuelto en buen estado'
            }
          }),
          // Préstamo pendiente
          tx.prestamo.create({
            data: {
              inventario_id: inventario[9].id,
              persona_id: estudiantes[3].id,
              instructor_id: instructor2.id,
              cantidad: 1,
              fecha_devolucion: new Date(Date.now() + 14 * 86400000), // +14 días
              estado: 'ACTIVO',
              observaciones: 'Préstamo para proyecto final'
            }
          }),
        ]);

        // Marcar vencidos
        await tx.prestamo.updateMany({
          where: {
            estado: 'ACTIVO',
            fecha_devolucion: { lt: new Date() },
          },
          data: { estado: 'VENCIDO' }
        });

        const usuariosCount = await tx.usuario.count();
        const rolesCount = await tx.role.count();
        const personasCount = await tx.persona.count();
        const inventarioCount = await tx.inventario.count();
        const prestamosCount = await tx.prestamo.count();

        return {
          personas: personasCount,
          herramientas: inventarioCount,
          prestamos: prestamosCount,
          ubicaciones: ubicaciones.length,
          categorias: categorias.length,
          usuariosPreservados: usuariosCount,
          rolesPreservados: rolesCount,
        };
      });

      res.json({
        status: 'success',
        mensaje: 'Datos de ejemplo insertados correctamente',
        data: result
      });
    } catch (error) {
      logger.error('Error al sembrar datos:', error);
      res.status(500).json({ status: 'error', mensaje: 'Error al insertar datos de ejemplo', detalles: [error.message] });
    }
  },
};

module.exports = seedController;
